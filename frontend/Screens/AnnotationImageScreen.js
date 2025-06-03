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
} from "react-native";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CircleCheck as CheckCircle,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Rect, Circle, Text as SvgText } from "react-native-svg";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";
import api, { getCsrfToken } from "../api";

const { width, height } = Dimensions.get("window");

export default function AnnotationSImagecreen() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [keypoints, setKeypoints] = useState([]);
  const [boundingBox, setBoundingBox] = useState([0, 0, 0, 0]);
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });

  const imageRef = useRef(null);

  const BASE_URL = "http://127.0.0.1:5000";

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

    // if (!token) {
    //   console.error('No authentication token found.');
    //   setLoading(false);
    //   return;
    // }

    try {
      const response = await fetch(`${BASE_URL}/api/annotation/`, {
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
        uri: item.image.image.startsWith("http")
          ? item.image.image
          : `${BASE_URL}${item.image.image}`,
        annotations: Array.isArray(item.annotations) ? item.annotations : [],
        boundingBox: item.bounding_box || [0, 0, 0, 0],
        saved: item.saved || false,
        originalWidth: item.image.originalwidth || 0,
        originalHeight: item.image.originalheight || 0,
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
    const token = await AsyncStorage.getItem("access_token");

    try {
      const csrfToken = await getCsrfToken();
      // Use the annotateimage2 endpoint
      console.log("THE image id is ", imageId);
      const response = await fetch(`${BASE_URL}/api/annotation/${imageId}/`, {
        method: "GET",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch details for image ${imageId}`);
      }

      const data = await response.json();
      console.log("API response data:", data);

      // Ensure annotations is an array before setting
      const annotations = Array.isArray(data.annotations)
        ? data.annotations
        : [];
      console.log("adjusted", data.annotations);

      // Update the keypoints and boundingBox state
      setKeypoints(data.annotations);
      setBoundingBox(data.bounding_box || [0, 0, 0, 0]);
      setOriginalSize({
        width: data.originalwidth || 0,
        height: data.originalheight || 0,
      });

      // Update the selected image state
      setSelectedImage((prevImage) => ({
        ...prevImage,
        annotations: annotations,
        boundingBox: data.bounding_box || [0, 0, 0, 0],
        originalWidth: data.originalwidth || 0,
        originalHeight: data.originalheight || 0,
      }));
    } catch (error) {
      console.error("Error fetching image details:", error);
      Alert.alert("Error", "Failed to fetch image details. Please try again.");
    }
    setLoadingDetails(false);
  };

  // Filter images based on the filter state
  const filteredImages = images.filter((img) => {
    if (filter === "saved") return img.saved;
    if (filter === "unsaved") return !img.saved;
    return true;
  });

  // Updated openImage to await the details fetch and then set the selected image
  const openImage = async (index) => {
    const image = filteredImages[index];
    if (!image) {
      console.warn("No image found at index:", index);
      return;
    }
    setCurrentIndex(index);

    // Pre-set the selected image so we can show it immediately
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

  const saveKeypoints = async () => {
    if (!selectedImage) return;

    if (!Array.isArray(keypoints)) {
      Alert.alert("Error", "Keypoints data is not in the correct format");
      return;
    }

    // Format keypoints to have 2 decimal places
    const adjustedKeypoints = keypoints.map(([x, y]) => [
      parseFloat(x.toFixed(2)),
      parseFloat(y.toFixed(2)),
    ]);

    const csrfToken = await getCsrfToken();

    try {
      const response = await fetch(
        `${BASE_URL}/api/savekeypoints/${selectedImage.id}/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ keypoints: adjustedKeypoints }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save keypoints");
      }

      const data = await response.json();
      console.log(data);

      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === selectedImage.id
            ? { ...img, saved: true, annotations: adjustedKeypoints }
            : img
        )
      );

      setSelectedImage((prev) => ({
        ...prev,
        saved: true,
        annotations: adjustedKeypoints,
      }));

      Alert.alert("Success", data.message || "Keypoints saved successfully");
    } catch (error) {
      console.error("Error saving keypoints:", error);
      Alert.alert("Error", "Failed to save keypoints. Please try again.");
    }
  };

  const submit = async () => {
    if (!selectedImage) return;

    // Check if keypoints is an array before using map
    if (!Array.isArray(keypoints)) {
      Alert.alert("Error", "Keypoints data is not in the correct format");
      return;
    }

    // Format keypoints to have 2 decimal places
    const adjustedKeypoints = keypoints.map(([x, y]) => [
      parseFloat(x.toFixed(2)),
      parseFloat(y.toFixed(2)),
    ]);

    const csrfToken = await getCsrfToken();

    try {
      const response = await fetch(
        `${BASE_URL}/api/verifier2/${selectedImage.id}/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,

            "Content-Type": "application/json", // Set correct Content-Type
          },
          body: JSON.stringify({ keypoints: adjustedKeypoints }),
        }
      );

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

  // Handle image layout to get dimensions
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
  // Using Gesture Handler for dragging keypoints
  const updateKeypointPosition = (x, y, pointIndex) => {
    if (pointIndex === null) return;

    const { scaleX, scaleY, offsetX, offsetY } = calculateScaling();

    const originalX = (x - offsetX) / scaleX;
    const originalY = (y - offsetY) / scaleY;

    const newKeypoints = [...keypoints];
    newKeypoints[pointIndex] = [
      Math.max(0, Math.min(originalX, originalSize.width)),
      Math.max(0, Math.min(originalY, originalSize.height)),
    ];

    setKeypoints(newKeypoints);
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

  const findClosestPoint = (x, y) => {
    if (!Array.isArray(keypoints) || keypoints.length === 0) return null;

    const { scaleX, scaleY, offsetX, offsetY } = calculateScaling();

    let closestIndex = null;
    let minDist = 30;

    keypoints.forEach(([pointX, pointY], index) => {
      const scaledX = pointX * scaleX + offsetX;
      const scaledY = pointY * scaleY + offsetY;
      const dist = Math.hypot(scaledX - x, scaledY - y);

      if (dist < minDist) {
        minDist = dist;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  // Create a gesture for dragging keypoints
  const panGesture = Gesture.Pan()
    .onStart((e) => {
      const pointIndex = findClosestPoint(e.x, e.y);
      runOnJS(setSelectedPointIndex)(pointIndex);
    })
    .onUpdate((e) => {
      if (selectedPointIndex !== null) {
        runOnJS(updateKeypointPosition)(e.x, e.y, selectedPointIndex);
      }
    })
    .onEnd(() => {
      runOnJS(setSelectedPointIndex)(null);
    });

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
            fill={selectedPointIndex === index ? "yellow" : "blue"}
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

          {selectedImage && (
            <GestureDetector gesture={panGesture}>
              <View style={styles.imageAnnotationContainer}>
                <Image
                  ref={imageRef}
                  source={{ uri: selectedImage.uri }}
                  style={styles.fullImage}
                  onLayout={onImageLayout}
                />

                {/* SVG overlay for annotations */}
                <Svg
                  style={StyleSheet.absoluteFill}
                  width={imageSize.width}
                  height={imageSize.height}
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
            </GestureDetector>
          )}

          <TouchableOpacity style={styles.arrowRight} onPress={handleNext}>
            <ChevronRight size={40} color="#fff" />
          </TouchableOpacity>

          {/* Show loading indicator while fetching details */}
          {loadingDetails && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={saveKeypoints}
              disabled={loadingDetails}
            >
              <Text style={styles.buttonText}>Save Keypoints</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleNext}
              disabled={loadingDetails}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handlePrev}
              disabled={loadingDetails}
            >
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={submit}
              disabled={loadingDetails}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
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
});
