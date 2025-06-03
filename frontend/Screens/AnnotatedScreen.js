import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Text,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
} from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");


const BASE_URL = "http://127.0.0.1:5000"; 

export const getImages = async (token) => {
  try {
    const response = await fetch(`${BASE_URL}/api/annotated/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch images");
    }

    const data = await response.json();
    console.log("API Response:", data);

    
    return data.map((item) => ({
      id: item.id.toString(),
      uri: item.image.image.startsWith("/media/") ? `${BASE_URL}${item.image.image}` : item.image.image,
    }));
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
};


const ImageScreen = ({ navigation }) => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [likedImages, setLikedImages] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);

    const token = await AsyncStorage.getItem("access_token");
    console.log("retrieved toekn ",token) // Retrieve JWT token
    if (!token) {
      console.error("No authentication token found.");
      setLoading(false);
      return;
    }

    const imageData = await getImages(token);
    setImages(imageData);
    setLoading(false);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!selectedImage) return; // Ignore if modal is not open

      switch (event.key) {
        case "ArrowRight":
          nextImage();
          break;
        case "ArrowLeft":
          prevImage();
          break;
        case "Escape":
          closeModal();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, currentIndex]);

  const openImage = (index) => {
    setCurrentIndex(index);
    setSelectedImage(images[index]);
    setScale(1);
  };

  const handleNext = () => {
    if (images.length === 0) return;
    const newIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
    setScale(1);
  };

  const handlePrev = () => {
    if (images.length === 0) return;
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
    setScale(1);
  };

  const onPinchEvent = (event) => {
    setScale(event.nativeEvent.scale);
  };

  const toggleLike = (id) => {
    setLikedImages((prevLikedImages) => ({
      ...prevLikedImages,
      [id]: !prevLikedImages[id],
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Images</Text>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#1877F2" style={styles.loader} />
        ) : images.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="image" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No images found</Text>
          </View>
        ) : (
          <FlatList
            data={images}
            numColumns={3}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => openImage(index)} style={styles.imageContainer}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.flatListContent}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          />
        )}

        <Modal visible={!!selectedImage} transparent={true}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedImage(null)}>
              <Icon name="x" size={30} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.arrowLeft} onPress={handlePrev}>
              <Icon name="chevron-left" size={40} color="#fff" />
            </TouchableOpacity>

            <GestureHandlerRootView style={styles.gestureContainer}>
              <PinchGestureHandler onGestureEvent={onPinchEvent}>
                <View>
                  {selectedImage && (
                    <Image
                      source={{ uri: selectedImage.uri }}
                      style={[styles.fullImage, { transform: [{ scale }] }]}
                    />
                  )}
                </View>
              </PinchGestureHandler>
            </GestureHandlerRootView>

            <TouchableOpacity style={styles.arrowRight} onPress={handleNext}>
              <Icon name="chevron-right" size={40} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.likeButton,
                { backgroundColor: likedImages[selectedImage?.id] ? "#1877F2" : "#fff" },
              ]}
              onPress={() => toggleLike(selectedImage?.id)}
            >
              <Icon
                name="heart"
                size={30}
                color={likedImages[selectedImage?.id] ? "#fff" : "#1877F2"}
              />
            </TouchableOpacity>
          </View>
        </Modal>
      </ScrollView>
    </View>
    
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  scrollContainer: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1, padding: 5 },
  imageContainer: { flex: 1, margin: 4, borderRadius: 8, overflow: "hidden", backgroundColor: "#eee" },
  thumbnail: { width: (width - 40) / 3, height: (width - 40) / 3, resizeMode: "cover" },
  flatListContent: { paddingBottom: 10 },
  modalContainer: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.9)", justifyContent: "center", alignItems: "center" },
  gestureContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  fullImage: { width: width * 0.9, height: height * 0.8, resizeMode: "contain" },
  closeButton: { position: "absolute", top: 40, right: 20, zIndex: 1 },
  arrowLeft: { position: "absolute", left: 10, top: "50%", zIndex: 1 },
  arrowRight: { position: "absolute", right: 10, top: "50%", zIndex: 1 },
  likeButton: {
    position: "absolute",
    bottom: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1877F2",
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 10, fontSize: 16, color: "#999" },
});

export default ImageScreen;
