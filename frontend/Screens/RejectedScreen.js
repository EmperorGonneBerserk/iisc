import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native';

export default function RejectedScreen() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/rejected-images/')
      .then(res => res.json())
      .then(data => {
        setImages(data.images || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading rejected images:', err);
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Rejected Images</Text>
      {loading ? (
        <ActivityIndicator size="large" color="red" />
      ) : images.length === 0 ? (
        <Text style={styles.noData}>No rejected images available.</Text>
      ) : (
        <FlatList
          data={images}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          renderItem={({ item }) => (
            <Image source={{ uri: item.url }} style={styles.image} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  image: {
    width: '48%',
    height: 150,
    margin: '1%',
    borderRadius: 8
  },
  noData: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 30
  }
});
