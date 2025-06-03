import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Picker, Button, Alert, SafeAreaView } from 'react-native';
import { getCsrfToken } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AssignImageScreen() {
  const [images, setImages] = useState([]);
  const [annotators, setAnnotators] = useState([]);
  const [assignments, setAssignments] = useState({}); // imageId -> annotatorId

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

  const handleAssign = async (imageId) => {
    const annotatorId = assignments[imageId];
    if (!annotatorId) {
      Alert.alert('Please select an annotator');
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
          user_id: annotatorId,
          image_ids: [imageId]
        }),
      });

      if (res.ok) {
        Alert.alert('Success', 'Image assigned successfully');
      } else {
        const errorData = await res.json();
        Alert.alert('Error', errorData.message || 'Failed to assign image');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.imageWrapper}>
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <Text>Assign to:</Text>
      <Picker
        selectedValue={assignments[item.id]}
        onValueChange={(value) =>
          setAssignments((prev) => ({ ...prev, [item.id]: value }))
        }>
        <Picker.Item label="Select Annotator" value={null} />
        {annotators.map((a) => (
          <Picker.Item key={a.id} label={a.username} value={a.id} />
        ))}
      </Picker>
      <Button title="Assign" onPress={() => handleAssign(item.id)} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={images}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ padding: 20 }}
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
  imageWrapper: {
    marginBottom: 30,
  },
  image: {
    height: 200,
    resizeMode: 'contain',
    marginBottom: 10,
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
