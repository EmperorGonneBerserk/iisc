import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Picker, Button, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { getCsrfToken } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AssignImageScreen() {
  const [images, setImages] = useState([]);
  const [annotators, setAnnotators] = useState([]);
  const [selectedAnnotator, setSelectedAnnotator] = useState(null);
  const [selectedImages, setSelectedImages] = useState(new Set());

  useEffect(() => {
    fetchImages();
    fetchAnnotators();
  }, []);

  const fetchImages = async () => {
    const res = await fetch('http://127.0.0.1:5000/api/imagesforannotator/');
    const data = await res.json();
    setImages(data.images_data);
  };

  const fetchAnnotators = async () => {
    const res = await fetch('http://127.0.0.1:5000/api/annotators/');
    const data = await res.json();
    setAnnotators(data.users);
  };

  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const handleAssignSelected = async () => {
    if (!selectedAnnotator) {
      Alert.alert('Error', 'Please select an annotator first');
      return;
    }

    if (selectedImages.size === 0) {
      Alert.alert('Error', 'Please select at least one image');
      return;
    }

    try {
      const csrfToken = await getCsrfToken();
      const accessToken = await AsyncStorage.getItem('accessToken');

      if (!accessToken) {
        Alert.alert('Error', 'You are not authenticated. Please login again.');
        return;
      }

      const res = await fetch(`http://127.0.0.1:5000/api/superuserimages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRFToken': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: selectedAnnotator,
          image_ids: Array.from(selectedImages)
        }),
      });

      if (res.ok) {
        Alert.alert('Success', 'Images assigned successfully');
        setSelectedImages(new Set()); // Clear selection after successful assignment
      } else {
        const errorData = await res.json();
        Alert.alert('Error', errorData.message || 'Failed to assign images');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.imageWrapper,
        selectedImages.has(item.id) && styles.selectedImage
      ]}
      onPress={() => toggleImageSelection(item.id)}
    >
      <Image source={{ uri: item.image_url }} style={styles.image} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Select Annotator:</Text>
        <Picker
          selectedValue={selectedAnnotator}
          style={styles.picker}
          onValueChange={setSelectedAnnotator}>
          <Picker.Item label="Select Annotator" value={null} />
          {annotators.map((a) => (
            <Picker.Item key={a.id} label={a.username} value={a.id} />
          ))}
        </Picker>
        <Button
          title={`Assign ${selectedImages.size} Selected Images`}
          onPress={handleAssignSelected}
          disabled={selectedImages.size === 0 || !selectedAnnotator}
        />
      </View>
      <FlatList
        data={images}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={true}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: "100vh",
    overflowY: "auto",
  },
  header: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  picker: {
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  listContainer: {
    padding: 10,
  },
  imageWrapper: {
    flex: 1,
    margin: 5,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedImage: {
    borderColor: '#007AFF',
  },
  image: {
    height: 150,
    resizeMode: 'contain',
  },
});



// import React, { useEffect, useState } from "react";
// import {
//   SafeAreaView,
//   View,
//   FlatList,
//   Image,
//   StyleSheet,
//   Dimensions,
// } from "react-native";

// export default function AssignImageScreen() {
//   const [images, setImages] = useState([]);

//   useEffect(() => {
//     fetch("http://127.0.0.1:5000/api/imagesforannotator/")
//       .then((res) => res.json())
//       .then((data) => {
//         setImages(data.images_data);
//       })
//       .catch((err) => console.error(err));
//   }, []);

//   const renderItem = ({ item }) => {
//     const screenWidth = Dimensions.get("window").width;
//     const scaleFactor = screenWidth / parseFloat(item.originalwidth);
//     const displayHeight = parseFloat(item.originalheight) * scaleFactor;

//     return (
//       <View style={[styles.imageWrapper, { width: screenWidth, height: displayHeight }]}>
//         <Image
//           source={{ uri: item.image_url }}
//           style={{ width: screenWidth, height: displayHeight }}
//           resizeMode="contain"
//         />
//         {item.annotations.map((point, index) => {
//           const [x, y] = point;
//           const scaledX = x * scaleFactor;
//           const scaledY = y * scaleFactor;
//           return (
//             <View
//               key={index}
//               style={{
//                 position: "absolute",
//                 top: scaledY - 5,
//                 left: scaledX - 5,
//                 width: 10,
//                 height: 10,
//                 borderRadius: 5,
//                 backgroundColor: "red",
//                 borderWidth: 1,
//                 borderColor: "white",
//               }}
//             />
//           );
//         })}
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <FlatList
//         data={images}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={renderItem}
//         showsVerticalScrollIndicator={true}
//         contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     maxHeight: "100vh",
//     overflowY: "auto",
//   },
//   imageWrapper: {
//     marginBottom: 30,
//     borderWidth: 1,
//     borderColor: "#ccc",
//   },
// });
