import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CircleCheck as CheckCircle,
  Flag,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Rect, Circle, Text as SvgText } from "react-native-svg";
import Animated from "react-native-reanimated";
import api, { getCsrfToken } from "../api";

const { width, height } = Dimensions.get("window");

export default function hello() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [keypoints, setKeypoints] = useState([]);
  const [boundingBox, setBoundingBox] = useState([0, 0, 0, 0]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });

  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageRef = useRef(null);
  const flatListRef = useRef(null);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const BASE_URL = "http://127.0.0.1:5000";

  // Calculate display size based on container and original image dimensions
  const getDisplaySize = () => {
    if (
      !originalSize.width ||
      !originalSize.height ||
      !imageSize.width ||
      !imageSize.height
    ) {
      return { width: imageSize.width, height: imageSize.height };
    }

    const imageAspectRatio = originalSize.width / originalSize.height;
    const displayAspectRatio = imageSize.width / imageSize.height;

    if (imageAspectRatio > displayAspectRatio) {
      return {
        width: imageSize.width,
        height: imageSize.width / imageAspectRatio,
      };
    } else {
      return {
        width: imageSize.height * imageAspectRatio,
        height: imageSize.height,
      };
    }
  };

  const displaySize = getDisplaySize();

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    if (selectedImage) {
      setKeypoints(selectedImage.annotations);
      setBoundingBox(selectedImage.boundingBox || [0, 0, 0, 0]);
      console.log("Selected image annotations:", selectedImage.annotations);
      console.log("Selected image boundingBox:", selectedImage.boundingBox);
      console.log("Keypoints value:", keypoints);
      console.log("Keypoints type:", typeof keypoints);

      // Get original image dimensions
      if (selectedImage.originalWidth && selectedImage.originalHeight) {
        setOriginalSize({
          width: selectedImage.originalWidth,
          height: selectedImage.originalHeight,
        });
        console.log("Original width:", selectedImage.originalWidth);
        console.log("Original height:", selectedImage.originalHeight);
      } else {
        // Fallback to getting dimensions from the image itself
        Image.getSize(selectedImage.uri, (width, height) => {
          setOriginalSize({ width, height });
        });
      }
    }
  }, [selectedImage]);

  const loadImages = async () => {
    setLoading(true);
    const csrfToken = await getCsrfToken();
    console.log("csrf", csrfToken);

    try {
      const response = await fetch(`${BASE_URL}/api/verifier/`, {
        method: "GET",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });

      const data = await response.json();

      console.log("data", data);

      // Ensure the URL is fully qualified and annotations is always an array
      const formattedData = data.map((item) => ({
        id: item.id.toString(),
        uri: item.annotation.image.image.startsWith("http")
          ? item.annotation.image.image
          : `${BASE_URL}${item.annotation.image.image}`,
        annotations: Array.isArray(item.annotations) ? item.annotations : [],
        boundingBox: item.annotation.bounding_box || [0, 0, 0, 0],
        saved: item.saved || false,
        originalWidth: item.annotation.image.originalwidth || 0,
        originalHeight: item.annotation.image.originalheight || 0,
        comments: item.comments || "",
        isFlagged: item.flagged || false,
        isApproved: item.approved || false,
      }));

      console.log("Formatted Images:", formattedData);
      setImages(formattedData);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
    setLoading(false);
  };

  const getImageDetails = async (imageId) => {
    setLoadingDetails(true);
    try {
      const csrfToken = await getCsrfToken();
      // Use the annotateimage2 endpoint
      const response = await fetch(
        `${BASE_URL}/api/verifiedimage/${imageId}/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch details for image ${imageId}`);
      }

      const data = await response.json();
      console.log("image", data);
      console.log("selected image detail", data.id);
      console.log("API response data:", data.annotations);
      console.log("api annotation inner response", data.annotation.annotations);

      // Ensure annotations is an array before setting
      const annotations = Array.isArray(data.annotations)
        ? data.annotations
        : [];

      console.log("adjusted", data.annotations);

      setKeypoints(data.annotations);
      setBoundingBox(data.annotation.image.bounding_box || [0, 0, 0, 0]);
      setOriginalSize({
        width: data.annotation.image.originalwidth || 0,
        height: data.annotation.image.originalheight || 0,
      });

      setSelectedImage((prevImage) => ({
        ...prevImage,
        annotations: annotations,
        boundingBox: data.annotation.bounding_box || [0, 0, 0, 0],
        originalWidth: data.annotation.image.originalwidth || 0,
        originalHeight: data.annotation.image.originalheight || 0,
      }));
    } catch (error) {
      console.error("Error fetching image details:", error);
      Alert.alert("Error", "Failed to fetch image details. Please try again.");
    }
    setLoadingDetails(false);
  };

  const filteredImages = images.filter((img) => {
    if (filter === "saved") return img.saved;
    if (filter === "unsaved") return !img.saved;
    return true;
  });

  const openImage = async (index) => {
    const image = filteredImages[index];
    if (!image) {
      console.warn("No image found at index:", index);
      return;
    }
    setCurrentIndex(index);

    setSelectedImage(image);

    await getImageDetails(image.id);
  };

  const handleNext = () => {
    if (filteredImages.length === 0) return;
    let newIndex = currentIndex + 1;
    if (newIndex >= filteredImages.length) {
      newIndex = 0;
    }
    openImage(newIndex);
  };

  const handlePrev = () => {
    if (filteredImages.length === 0) return;
    let newIndex = currentIndex - 1;
    if (newIndex < 0) {
      newIndex = filteredImages.length - 1;
    }
    openImage(newIndex);
  };

  const submit = async () => {
    if (!selectedImage) return;

    if (!Array.isArray(keypoints)) {
      Alert.alert("Error", "Keypoints data is not in the correct format");
      return;
    }

    const adjustedKeypoints = keypoints.map(([x, y]) => [
      parseFloat(x.toFixed(2)),
      parseFloat(y.toFixed(2)),
    ]);

    const csrfToken = await getCsrfToken();

    console.log(selectedImage.isflagged);

    try {
      const response = await fetch(
        `${BASE_URL}/api/finalimage/${selectedImage.id}/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // keypoints: adjustedKeypoints,
            // approved: selectedImage.isApproved,
            flagged: selectedImage.isFlagged,
            comments: selectedImage.comments,
          }),
        }
      );

      console.log(selectedImage.isflagged, selectedImage.isApproved);

      if (!response.ok) {
        throw new Error("Failed to submit keypoints");
      }

      const data = await response.json();
      console.log(data);

      Alert.alert(
        "Success",
        data.message || "Keypoints submitted successfully"
      );
    } catch (error) {
      console.error("Error submitting keypoints:", error);
      Alert.alert("Error", "Failed to submit keypoints. Please try again.");
    }
  };

  const toggleFlag = () => {
    if (!selectedImage) return;

    setSelectedImage((prev) => {
      const newFlagStatus = !prev.isFlagged;

      const newApproveStatus = newFlagStatus ? false : prev.isApproved;

      return {
        ...prev,
        isFlagged: newFlagStatus,
        isApproved: newApproveStatus,
      };
    });

    setImages((prevImages) =>
      prevImages.map((img) => {
        if (img.id === selectedImage.id) {
          const newFlagStatus = !img.isFlagged;

          return {
            ...img,
            isFlagged: newFlagStatus,
            isApproved: newFlagStatus ? false : img.isApproved,
          };
        }
        return img;
      })
    );
  };

  const toggleApprove = () => {
    if (!selectedImage) return;

    setSelectedImage((prev) => {
      const newApproveStatus = !prev.isApproved;

      const newFlagStatus = newApproveStatus ? false : prev.isFlagged;

      return {
        ...prev,
        isApproved: newApproveStatus,
        isFlagged: newFlagStatus,
      };
    });

    // Update the images array
    setImages((prevImages) =>
      prevImages.map((img) => {
        if (img.id === selectedImage.id) {
          const newApproveStatus = !img.isApproved;
          // If approving, also un-flag
          return {
            ...img,
            isApproved: newApproveStatus,
            isFlagged: newApproveStatus ? false : img.isFlagged,
          };
        }
        return img;
      })
    );
  };

  const saveComments = (newComments) => {
    if (!selectedImage) return;

    setSelectedImage((prev) => ({
      ...prev,
      comments: newComments,
    }));

    setImages((prevImages) =>
      prevImages.map((img) =>
        img.id === selectedImage.id ? { ...img, comments: newComments } : img
      )
    );

    setCommentsModalVisible(false);
  };

  const onImageLayout = (event) => {
    const { width: layoutWidth, height: layoutHeight } =
      event.nativeEvent.layout;
    setImageSize({ width: layoutWidth, height: layoutHeight });
  };

  const calculateScaling = () => {
    if (
      !selectedImage ||
      !originalSize.width ||
      !originalSize.height ||
      !imageSize.width ||
      !imageSize.height
    ) {
      return {
        scaleX: 1,
        scaleY: 1,
        offsetX: 0,
        offsetY: 0,
        scaledWidth: imageSize.width,
        scaledHeight: imageSize.height,
      };
    }

    const imageAspectRatio = originalSize.width / originalSize.height;
    const displayAspectRatio = imageSize.width / imageSize.height;

    let scaledWidth,
      scaledHeight,
      offsetX = 0,
      offsetY = 0;

    if (imageAspectRatio > displayAspectRatio) {
      scaledWidth = imageSize.width;
      scaledHeight = scaledWidth / imageAspectRatio;
      offsetY = (imageSize.height - scaledHeight) / 2;
    } else {
      scaledHeight = imageSize.height;
      scaledWidth = scaledHeight * imageAspectRatio;
      offsetX = (imageSize.width - scaledWidth) / 2;
    }

    const scaleX = scaledWidth / originalSize.width;
    const scaleY = scaledHeight / originalSize.height;

    return {
      scaleX,
      scaleY,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight,
    };
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!selectedImage) return;

      switch (event.key) {
        case "ArrowRight":
          handleNext();
          break;
        case "ArrowLeft":
          handlePrev();
          break;
        case "Escape":
          setSelectedImage(null);
          break;
        default:
          break;
      }
    };

    if (Platform.OS === "web") {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedImage, currentIndex]);

  const goToNextImage = () => {
    if (currentIndex < filteredImages.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      openImage(newIndex);
    }
  };

  const goToPrevImage = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      openImage(newIndex);
    }
  };

  const renderCarouselItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        style={[
          styles.carouselItem,
          currentIndex === index && styles.selectedCarouselItem,
        ]}
        onPress={() => {
          setCurrentIndex(index);
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.carouselImage}
          resizeMode="cover"
        />

        {item.isFlagged && (
          <View style={styles.flagIndicator}>
            <Flag color="white" size={14} />
          </View>
        )}

        {item.isApproved && (
          <View style={styles.approveIndicator}>
            <CheckCircle color="white" size={14} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Helper function to safely render SVG elements
  const renderSvgElements = () => {
    if (!Array.isArray(keypoints)) {
      console.error("Keypoints is not an array:", keypoints);
      return null;
    }

    return keypoints.map(([x, y], index) => {
      const { scaleX, scaleY, offsetX, offsetY } = calculateScaling();

      return (
        <React.Fragment key={index}>
          <Circle
            cx={x * scaleX + offsetX}
            cy={y * scaleY + offsetY}
            r={5}
            fill="blue"
          />
          <SvgText
            x={x * scaleX + offsetX + 10}
            y={y * scaleY + offsetY - 10}
            fill="white"
            fontSize="12"
          >
            {index + 1}
          </SvgText>
        </React.Fragment>
      );
    });
  };

  // Filter selection component
  const FilterSelector = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>Filter: </Text>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === "all" && styles.filterButtonActive,
        ]}
        onPress={() => setFilter("all")}
      >
        <Text
          style={[
            styles.filterButtonText,
            filter === "all" && styles.filterButtonTextActive,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === "saved" && styles.filterButtonActive,
        ]}
        onPress={() => setFilter("saved")}
      >
        <Text
          style={[
            styles.filterButtonText,
            filter === "saved" && styles.filterButtonTextActive,
          ]}
        >
          Saved
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === "unsaved" && styles.filterButtonActive,
        ]}
        onPress={() => setFilter("unsaved")}
      >
        <Text
          style={[
            styles.filterButtonText,
            filter === "unsaved" && styles.filterButtonTextActive,
          ]}
        >
          Unsaved
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Image Annotation</Text>

      {/* Filter Buttons */}
      <FilterSelector />

      {/* Loader */}
      {loading && <ActivityIndicator size="large" color="#007EE5" />}

      {/* Image Grid */}
      <FlatList
        data={filteredImages}
        numColumns={3}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => openImage(index)}
            style={styles.imageContainer}
          >
            <Image source={{ uri: item.uri }} style={styles.thumbnail} />
            {item.saved && (
              <CheckCircle size={20} color="green" style={styles.savedIcon} />
            )}
            {item.isFlagged && (
              <Flag size={20} color="red" style={styles.flagIconThumb} />
            )}
            {item.isApproved && (
              <CheckCircle
                size={20}
                color="blue"
                style={styles.approveIconThumb}
              />
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.flatListContent}
      />

      {/* Full Image Modal with Annotation */}
      <Modal visible={!!selectedImage} transparent={true}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedImage(null)}
          >
            <X size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.arrowLeft} onPress={handlePrev}>
            <ChevronLeft size={40} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.arrowRight} onPress={handleNext}>
            <ChevronRight size={40} color="#fff" />
          </TouchableOpacity>

          {selectedImage && (
            <View style={styles.imageAnnotationContainer}>
              <Image
                ref={imageRef}
                source={{ uri: selectedImage.uri }}
                style={styles.fullImage}
                onLayout={onImageLayout}
                onLoad={() => setImageLoaded(true)}
              />

              {/* SVG overlay for annotations - Read-only, no gesture detector */}
              <Svg
                style={StyleSheet.absoluteFill}
                width={imageSize.width}
                height={imageSize.height}
                ref={svgRef}
              >
                {/* Bounding box */}
                {boundingBox.length === 4 && (
                  <Rect
                    x={
                      boundingBox[0] * calculateScaling().scaleX +
                      calculateScaling().offsetX
                    }
                    y={
                      boundingBox[1] * calculateScaling().scaleY +
                      calculateScaling().offsetY
                    }
                    width={
                      (boundingBox[2] - boundingBox[0]) *
                      calculateScaling().scaleX
                    }
                    height={
                      (boundingBox[3] - boundingBox[1]) *
                      calculateScaling().scaleY
                    }
                    stroke="red"
                    strokeWidth="2"
                    fill="none"
                  />
                )}

                {/* Keypoints - safely rendered */}
                {renderSvgElements()}
              </Svg>
            </View>
          )}

          {/* Navigation Buttons - Position properly inside modal container */}
          <View style={styles.navButtonsContainer}>
            <TouchableOpacity
              style={[styles.navButton, styles.leftNavButton]}
              onPress={goToPrevImage}
              disabled={currentIndex === 0}
            >
              <ChevronLeft
                color={currentIndex === 0 ? "#ccc" : "#fff"}
                size={30}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, styles.rightNavButton]}
              onPress={goToNextImage}
              disabled={currentIndex === filteredImages.length - 1}
            >
              <ChevronRight
                color={
                  currentIndex === filteredImages.length - 1 ? "#ccc" : "#fff"
                }
                size={30}
              />
            </TouchableOpacity>
          </View>

          {/* Debug Info - Only in Development Mode */}
          {__DEV__ && selectedImage && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>
                Container Size: {imageSize.width}x{imageSize.height}
                {"\n"}
                Display Size: {displaySize.width.toFixed(0)}x
                {displaySize.height.toFixed(0)}
                {"\n"}
                Original Size: {originalSize.width}x{originalSize.height}
                {"\n"}
                Keypoints: {keypoints.length}
                {"\n"}
                Bounding Box: [{boundingBox.join(", ")}]{"\n"}
                Loaded: {imageLoaded ? "Yes" : "No"}
                {"\n"}
                Flagged: {selectedImage.isFlagged ? "Yes" : "No"}
                {"\n"}
                Approved: {selectedImage.isApproved ? "Yes" : "No"}
              </Text>
            </View>
          )}

          {/* Controls */}
          <View style={styles.controlsContainer}>
            {/* Add Comments Button */}
            <TouchableOpacity
              onPress={() => setCommentsModalVisible(true)}
              style={styles.controlButton}
            >
              <Text>Add Comments</Text>
            </TouchableOpacity>

            {/* Flag Button */}
            <TouchableOpacity
              onPress={toggleFlag}
              style={[
                styles.controlButton,
                { backgroundColor: selectedImage?.isFlagged ? "red" : "white" },
              ]}
            >
              <Flag color={selectedImage?.isFlagged ? "white" : "red"} />
              <Text
                style={{
                  color: selectedImage?.isFlagged ? "white" : "red",
                  marginLeft: 5,
                }}
              >
                {selectedImage?.isFlagged ? "Unflag" : "Flag"}
              </Text>
            </TouchableOpacity>

            {/* Approve Button */}
            <TouchableOpacity
              onPress={toggleApprove}
              style={[
                styles.controlButton,
                {
                  backgroundColor: selectedImage?.isApproved
                    ? "green"
                    : "white",
                },
              ]}
            >
              <CheckCircle
                color={selectedImage?.isApproved ? "white" : "green"}
              />
              <Text
                style={{
                  color: selectedImage?.isApproved ? "white" : "green",
                  marginLeft: 5,
                }}
              >
                {selectedImage?.isApproved ? "Approved" : "Approve"}
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={submit}
              style={[styles.controlButton, styles.submitButton]}
            >
              <CheckCircle color="white" />
              <Text style={{ color: "white", marginLeft: 5 }}>Submit</Text>
            </TouchableOpacity>
          </View>

          {/* Comments Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={commentsModalVisible}
            onRequestClose={() => setCommentsModalVisible(false)}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Comments</Text>
                  <TouchableOpacity
                    onPress={() => setCommentsModalVisible(false)}
                  >
                    <X size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.commentInput}
                  multiline
                  placeholder="Enter your comments here..."
                  value={selectedImage?.comments || ""}
                  onChangeText={(text) => {
                    // Update only the comments field in the selectedImage state
                    if (selectedImage) {
                      setSelectedImage({
                        ...selectedImage,
                        comments: text,
                      });
                    }
                  }}
                />

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={() => saveComments(selectedImage?.comments || "")}
                >
                  <Text style={styles.modalSaveButtonText}>Save Comments</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </Modal>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  filterLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f0f0f0",
  },
  filterButtonActive: {
    backgroundColor: "#007EE5",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#555",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  imageContainer: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#eee",
    position: "relative",
  },
  thumbnail: {
    width: (width - 40) / 3,
    height: (width - 40) / 3,
    resizeMode: "cover",
  },
  savedIcon: {
    position: "absolute",
    top: 5,
    right: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageAnnotationContainer: {
    position: "relative",
    width: width * 0.9,
    height: height * 0.7,
  },
  fullImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
  arrowLeft: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: [{ translateY: -20 }],
    zIndex: 2,
  },
  arrowRight: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -20 }],
    zIndex: 2,
  },
  navButtonsContainer: {
    position: "absolute",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 10,
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  leftNavButton: {
    position: "absolute",
    left: 10,
    top: height / 2 - 20,
  },
  rightNavButton: {
    position: "absolute",
    right: 10,
    top: height / 2 - 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    width: "80%",
  },
  button: {
    padding: 10,
    backgroundColor: "#007EE5",
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  flatListContent: {
    paddingBottom: 20,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "white",
    borderRadius: 5,
    marginHorizontal: 5,
  },
  submitButton: {
    backgroundColor: "#007EE5",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  modalTitle: {
    fontSize: 18,

    fontWeight: "bold",
  },

  commentInput: {
    width: "100%",

    height: 150,

    borderColor: "#ddd",

    borderWidth: 1,

    marginBottom: 15,

    padding: 10,

    borderRadius: 5,

    textAlignVertical: "top",
  },

  modalSaveButton: {
    backgroundColor: "#007EE5",

    padding: 12,

    borderRadius: 5,

    alignItems: "center",
  },

  modalSaveButtonText: {
    color: "white",

    fontWeight: "bold",
  },
});
