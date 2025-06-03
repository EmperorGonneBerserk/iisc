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
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
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

import {
  GestureHandlerRootView,
  PinchGestureHandler,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

import api, { getCsrfToken } from "../api";

const { width, height } = Dimensions.get("window");

function VerifierImageScreen({ route, navigation }) {
  const [images, setImages] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedImage, setSelectedImage] = useState(null);

  const [keypoints, setKeypoints] = useState([]);
  const [boundingBox, setBoundingBox] = useState([0, 0, 0, 0]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });

  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState("all");

  const [isFlagged, setIsFlagged] = useState(false);

  // Separate state variables for received comments and user input comments
  const [receivedComments, setReceivedComments] = useState("");
  const [inputComments, setInputComments] = useState("");

  const [commentsModalVisible, setCommentsModalVisible] = useState(false);

  const [imageLoaded, setImageLoaded] = useState(false);

  const imageRef = useRef(null);

  const flatListRef = useRef(null);

  const svgRef = useRef(null);

  const containerRef = useRef(null);

  const BASE_URL = "http://127.0.0.1:5000";

  const [isApproved, setIsApproved] = useState(false);

  const scale = useSharedValue(1);

  const translateX = useSharedValue(0);

  const translateY = useSharedValue(0);

  const scaleX = displaySize.width / originalSize.width;

  const scaleY = displaySize.height / originalSize.height;

  const offsetX = (imageSize.width - displaySize.width) / 2;

  const offsetY = (imageSize.height - displaySize.height) / 2;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(scale.value) },

      { translateX: withSpring(translateX.value) },

      { translateY: withSpring(translateY.value) },
    ],
  }));

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    if (
      images.length > 0 &&
      currentIndex >= 0 &&
      currentIndex < images.length
    ) {
      const newSelectedImage = images[currentIndex];

      setSelectedImage(newSelectedImage);

      // Reset states

      scale.value = 1;

      translateX.value = 0;

      translateY.value = 0;

      setImageLoaded(false);

      // Set annotations and bounding box from selected image

      if (newSelectedImage.annotations) {
        setKeypoints(
          Array.isArray(newSelectedImage.annotations)
            ? newSelectedImage.annotations
            : []
        );
      } else {
        setKeypoints([]);
      }

      if (
        newSelectedImage.boundingBox &&
        newSelectedImage.boundingBox.length === 4
      ) {
        setBoundingBox(newSelectedImage.boundingBox);
      } else {
        setBoundingBox([0, 0, 0, 0]);
      }

      // Update received comments from the server
      setReceivedComments(newSelectedImage.comments || "");
      // Clear input comments when switching images
      setInputComments("");

      setIsFlagged(false);

      setIsApproved(false);

      if (newSelectedImage.originalWidth && newSelectedImage.originalHeight) {
        setOriginalSize({
          width: newSelectedImage.originalWidth,

          height: newSelectedImage.originalHeight,
        });
      } else {
        Image.getSize(newSelectedImage.uri, (width, height) => {
          setOriginalSize({ width, height });
        });
      }
    }
  }, [currentIndex, images]);

  const loadImages = async () => {
    setLoading(true);

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(`${BASE_URL}/api/verifier/`, {
        method: "GET",

        credentials: "include",

        headers: {
          "X-CSRFToken": csrfToken,
        },
      });

      const data = await response.json();

      console.log("API Response:", data);

      const formattedData = data.map((item) => ({
        id: item.id.toString(),

        uri: item.annotation.image.image.startsWith("http")
          ? item.annotation.image.image
          : `${BASE_URL}${item.annotation.image.image}`,

        annotations: Array.isArray(item.annotation.annotations)
          ? item.annotation.annotations
          : [],

        boundingBox: item.annotation.bounding_box || [0, 0, 0, 0],

        saved: item.saved || false,

        originalWidth: item.annotation.image.originalwidth || 0,

        originalHeight: item.annotation.image.originalheight || 0,

        comments: item.comments || "",
      }));

      console.log("Formatted data sample:", formattedData[0]);

      setImages(formattedData);

      if (formattedData.length > 0) {
        setSelectedImage(formattedData[0]);

        setKeypoints(formattedData[0].annotations || []);

        setBoundingBox(formattedData[0].boundingBox || [0, 0, 0, 0]);

        // Set received comments
        setReceivedComments(formattedData[0].comments || "");
        // Clear input comments
        setInputComments("");
      }
    } catch (error) {
      console.error("Error fetching images:", error);

      Alert.alert("Error", "Failed to load images");
    }

    setLoading(false);
  };

  const calculateImageDisplayDimensions = () => {
    if (
      !imageLoaded ||
      !originalSize.width ||
      !originalSize.height ||
      !imageSize.width ||
      !imageSize.height
    ) {
      return {
        width: imageSize.width,

        height: imageSize.height,

        offsetX: 0,

        offsetY: 0,
      };
    }
    const imageAspectRatio = originalSize.width / originalSize.height;

    const containerAspectRatio = imageSize.width / imageSize.height;

    let displayWidth,
      displayHeight,
      offsetX = 0,
      offsetY = 0;

    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container (constrained by width)

      displayWidth = imageSize.width;

      displayHeight = displayWidth / imageAspectRatio;

      offsetY = (imageSize.height - displayHeight) / 2;
    } else {
      // Image is taller than container (constrained by height)

      displayHeight = imageSize.height;

      displayWidth = displayHeight * imageAspectRatio;

      offsetX = (imageSize.width - displayWidth) / 2;
    }

    return {
      width: displayWidth,

      height: displayHeight,

      offsetX,

      offsetY,
    };
  };

  const handleSubmit = async () => {
    try {
      const csrfToken = await getCsrfToken();

      // Combine received and input comments for submission
      const combinedComments = inputComments
        ? receivedComments
          ? `${receivedComments}\n\nNew comment: ${inputComments}`
          : inputComments
        : receivedComments;

      const submitData = {
        image_id: selectedImage.id,

        annotations: keypoints,

        bounding_box: boundingBox,

        flagged: isFlagged,

        comments: combinedComments,
      };

      const response = await fetch(
        `${BASE_URL}/api/annotation/${selectedImage.id}/submit/`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",

            "X-CSRFToken": csrfToken,
          },

          body: JSON.stringify(submitData),
        }
      );

      if (response.ok) {
        Alert.alert("Success", "Image annotations submitted successfully");

        // Update local state with the combined comments
        const updatedImages = [...images];

        updatedImages[currentIndex] = {
          ...updatedImages[currentIndex],

          annotations: keypoints,

          boundingBox: boundingBox,

          comments: combinedComments,
        };

        setImages(updatedImages);

        // Update received comments with the combined comments
        setReceivedComments(combinedComments);

        // Clear input comments after successful submission
        setInputComments("");
      } else {
        const errorData = await response.json();

        Alert.alert(
          "Error",
          errorData.message || "Failed to submit annotations"
        );
      }
    } catch (error) {
      console.error("Submit error:", error);

      Alert.alert("Error", "An error occurred while submitting");
    }
  };

  const onImageLoad = () => {
    setImageLoaded(true);

    // Get the image display dimensions to update our displaySize state

    if (imageRef.current) {
      imageRef.current.measure((x, y, width, height, pageX, pageY) => {
        const dimensions = calculateImageDisplayDimensions();

        setDisplaySize({
          width: dimensions.width,

          height: dimensions.height,
        });
      });
    }
  };

  const onImageLayout = (event) => {
    const { width: layoutWidth, height: layoutHeight } =
      event.nativeEvent.layout;

    setImageSize({ width: layoutWidth, height: layoutHeight });

    // Re-measure the image after layout changes

    if (imageRef.current && imageLoaded) {
      imageRef.current.measure((x, y, width, height, pageX, pageY) => {
        const dimensions = calculateImageDisplayDimensions();

        setDisplaySize({
          width: dimensions.width,

          height: dimensions.height,
        });
      });
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

        {isFlagged && currentIndex === index && (
          <View style={styles.flagIndicator}>
            <Flag color="white" size={14} />
          </View>
        )}

        {isApproved && currentIndex === index && (
          <View style={styles.approveIndicator}>
            <CheckCircle color="white" size={14} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const goToNextImage = () => {
    if (currentIndex < images.length - 1) {
      const newIndex = currentIndex + 1;

      setCurrentIndex(newIndex);

      flatListRef.current?.scrollToIndex({
        index: newIndex,

        animated: true,

        viewPosition: 0.5,
      });
    }
  };

  const goToPrevImage = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;

      setCurrentIndex(newIndex);

      flatListRef.current?.scrollToIndex({
        index: newIndex,

        animated: true,

        viewPosition: 0.5,
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator size="large" color="#007EE5" />
      ) : (
        <View style={{ flex: 1 }}>
          {/* Carousel at the top */}

          <View style={styles.topCarouselContainer}>
            <View style={styles.carouselHeader}>
              <Text style={styles.carouselTitle}>Images ({images.length})</Text>

              {currentIndex > 0 && (
                <TouchableOpacity
                  style={styles.carouselNavButton}
                  onPress={goToPrevImage}
                >
                  <ChevronLeft color="#333" size={20} />
                </TouchableOpacity>
              )}

              {currentIndex < images.length - 1 && (
                <TouchableOpacity
                  style={styles.carouselNavButton}
                  onPress={goToNextImage}
                >
                  <ChevronRight color="#333" size={20} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              ref={flatListRef}
              data={images}
              renderItem={renderCarouselItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={currentIndex}
              getItemLayout={(data, index) => ({
                length: 80,

                offset: 80 * index,

                index,
              })}
              contentContainerStyle={styles.carouselContent}
              onScrollToIndexFailed={(info) => {
                const wait = new Promise((resolve) => setTimeout(resolve, 500));

                wait.then(() => {
                  flatListRef.current?.scrollToIndex({
                    index: info.index,

                    animated: true,
                  });
                });
              }}
            />
          </View>

          {selectedImage && (
            <View style={{ flex: 1 }}>
              {/* Main Image Container */}

              <View
                ref={containerRef}
                style={styles.imageContainer}
                onLayout={(event) => {
                  const { width, height } = event.nativeEvent.layout;

                  setImageSize({ width, height });
                }}
              >
                {/* Main Image */}

                <Image
                  ref={imageRef}
                  source={{ uri: selectedImage.uri }}
                  style={styles.fullImage}
                  resizeMode="contain"
                  onLoad={onImageLoad}
                />

                {/* SVG Overlay */}

                {imageLoaded && (
                  <View
                    style={[StyleSheet.absoluteFill, styles.overlayContainer]}
                  >
                    <Svg
                      ref={svgRef}
                      width="100%"
                      height="100%"
                      viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                      style={styles.svgOverlay}
                    >
                      {/* Bounding Box */}

                      {boundingBox &&
                        boundingBox.length === 4 &&
                        boundingBox.every((val) => !isNaN(val)) && (
                          <Rect
                            x={
                              boundingBox[0] *
                                (displaySize.width / originalSize.width) +
                              (imageSize.width - displaySize.width) / 2
                            }
                            y={
                              boundingBox[1] *
                                (displaySize.height / originalSize.height) +
                              (imageSize.height - displaySize.height) / 2
                            }
                            width={
                              (boundingBox[2] - boundingBox[0]) *
                              (displaySize.width / originalSize.width)
                            }
                            height={
                              (boundingBox[3] - boundingBox[1]) *
                              (displaySize.height / originalSize.height)
                            }
                            stroke="red"
                            strokeWidth="2"
                            fill="none"
                          />
                        )}

                      {/* Annotation Points */}

                      {keypoints &&
                        keypoints.length > 0 &&
                        keypoints.map((point, index) => {
                          if (
                            !point ||
                            typeof point.x !== "number" ||
                            typeof point.y !== "number"
                          ) {
                            return null;
                          }

                          return (
                            <Circle
                              key={`point-${index}`}
                              cx={point.x * scaleX + offsetX}
                              cy={point.y * scaleY + offsetY}
                              r="5"
                              fill="red"
                              opacity="0.7"
                            />
                          );
                        })}
                    </Svg>
                  </View>
                )}

                {/* Navigation Buttons Overlay */}

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
                    disabled={currentIndex === images.length - 1}
                  >
                    <ChevronRight
                      color={
                        currentIndex === images.length - 1 ? "#ccc" : "#fff"
                      }
                      size={30}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Debug Info - Only in Development Mode */}

              {__DEV__ && (
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
                  onPress={() => {
                    setIsFlagged(!isFlagged);

                    if (!isFlagged) setIsApproved(false); // Unapprove when flagging
                  }}
                  style={[
                    styles.controlButton,

                    { backgroundColor: isFlagged ? "red" : "white" },
                  ]}
                >
                  <Flag color={isFlagged ? "white" : "red"} />

                  <Text
                    style={{
                      color: isFlagged ? "white" : "red",
                      marginLeft: 5,
                    }}
                  >
                    {isFlagged ? "Unflag" : "Flag"}
                  </Text>
                </TouchableOpacity>

                {/* Approve Button */}

                <TouchableOpacity
                  onPress={() => {
                    setIsApproved(!isApproved);

                    if (!isApproved) setIsFlagged(false); // Unflag when approving
                  }}
                  style={[
                    styles.controlButton,

                    { backgroundColor: isApproved ? "green" : "white" },
                  ]}
                >
                  <CheckCircle color={isApproved ? "white" : "green"} />

                  <Text
                    style={{
                      color: isApproved ? "white" : "green",
                      marginLeft: 5,
                    }}
                  >
                    {isApproved ? "Approved" : "Approve"}
                  </Text>
                </TouchableOpacity>

                {/* Submit Button */}

                <TouchableOpacity
                  onPress={handleSubmit}
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

                    {/* Display received comments section */}
                    {receivedComments ? (
                      <View style={styles.receivedCommentsContainer}>
                        <Text style={styles.receivedCommentsTitle}>
                          Previous Comments:
                        </Text>
                        <Text style={styles.receivedCommentsText}>
                          {receivedComments}
                        </Text>
                      </View>
                    ) : null}

                    {/* Input for new comments */}
                    <TextInput
                      style={styles.commentInput}
                      multiline
                      placeholder="Enter your new comments here..."
                      value={inputComments}
                      onChangeText={setInputComments}
                    />

                    <TouchableOpacity
                      style={styles.modalSaveButton}
                      onPress={() => setCommentsModalVisible(false)}
                    >
                      <Text style={styles.modalSaveButtonText}>
                        Save Comments
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topCarouselContainer: {
    backgroundColor: "#f8f8f8",

    borderBottomWidth: 1,

    borderColor: "#ddd",

    paddingBottom: 10,
  },

  carouselHeader: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    paddingHorizontal: 15,

    paddingVertical: 10,
  },

  carouselTitle: {
    fontSize: 16,

    fontWeight: "bold",

    color: "#333",
  },
  receivedCommentsContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#007EE5",
  },
  receivedCommentsTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 14,
    color: "#333",
  },
  receivedCommentsText: {
    fontSize: 14,
    color: "#555",
  },
  commentInput: {
    height: 120,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
    textAlignVertical: "top",
  },

  carouselNavButton: {
    padding: 5,
  },

  carouselContent: {
    paddingHorizontal: 10,
  },

  carouselItem: {
    width: 70,

    height: 70,

    marginHorizontal: 5,

    borderRadius: 5,

    overflow: "hidden",

    borderWidth: 2,

    borderColor: "transparent",

    position: "relative",
  },

  selectedCarouselItem: {
    borderColor: "#007EE5",
  },

  carouselImage: {
    width: "100%",

    height: "100%",
  },

  flagIndicator: {
    position: "absolute",

    top: 0,

    right: 0,

    backgroundColor: "red",

    borderRadius: 10,

    width: 20,

    height: 20,

    justifyContent: "center",

    alignItems: "center",
  },

  approveIndicator: {
    position: "absolute",

    top: 0,

    right: 0,

    backgroundColor: "green",

    borderRadius: 10,

    width: 20,

    height: 20,

    justifyContent: "center",

    alignItems: "center",
  },

  imageContainer: {
    flex: 1,

    position: "relative",

    backgroundColor: "#f0f0f0",
  },

  fullImage: {
    width: "100%",

    height: "100%",
  },

  overlayContainer: {
    pointerEvents: "none", // Allow touch events to pass through to image
  },

  svgOverlay: {
    position: "absolute",

    top: 0,

    left: 0,
  },

  debugContainer: {
    padding: 10,

    backgroundColor: "#e0e0e0",
  },

  debugText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",

    fontSize: 10,
  },

  navButtonsContainer: {
    position: "absolute",

    width: "100%",

    height: "100%",

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    paddingHorizontal: 10,
  },

  navButton: {
    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor: "rgba(0,0,0,0.5)",

    justifyContent: "center",

    alignItems: "center",
  },

  leftNavButton: {
    left: 10,
  },

  rightNavButton: {
    right: 10,
  },

  controlsContainer: {
    flexDirection: "row",

    justifyContent: "space-around",

    padding: 10,

    backgroundColor: "#f0f0f0",
  },

  controlButton: {
    flexDirection: "row",

    alignItems: "center",

    padding: 10,

    borderRadius: 5,

    backgroundColor: "white",

    elevation: 3,

    shadowColor: "#000",

    shadowOffset: { width: 0, height: 1 },

    shadowOpacity: 0.2,

    shadowRadius: 1,
  },

  submitButton: {
    backgroundColor: "#007EE5",
  },

  centeredView: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",

    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modalView: {
    width: "90%",

    backgroundColor: "white",

    borderRadius: 10,

    padding: 20,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,

      height: 2,
    },

    shadowOpacity: 0.25,

    shadowRadius: 4,

    elevation: 5,
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

export default VerifierImageScreen;
