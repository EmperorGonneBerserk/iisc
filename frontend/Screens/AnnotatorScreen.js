import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api";  // Ensure this is configured to use Django session authentication

const AnnotatorScreen = ({ navigation }) => {
  const [folders, setFolders] = useState([
    { id: '1', name: 'Assigned' },
    { id: '2', name: 'Yet to be annotated' },
    { id: '3', name: 'Annotated' }
  ]);
  const [username, setUsername] = useState("");

  // 🔹 Check session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.get("/session"); 
        console.log("hello",response.data.user) // ✅ Django session check
        if (response.data.isAuthenticated) {
          setUsername(response.data.user);
        } else {
          navigation.replace("Login");  // 🔄 Redirect to login if session expired
        }
      } catch (error) {
        console.error("Session check failed:", error);
        navigation.replace("Login");  
      }
    };

    checkSession();
  }, []);

  const openFolder = (folderId) => {
    if (folderId === "2") {
      navigation.navigate("AnnotationImageScreen", { folderId: 2 });
    }
    if (folderId === "1") {
      navigation.navigate("ImageScreen", { folderId: 1 });
    }
    if (folderId === "3") {
      navigation.navigate("Annotated", { folderId: 3 });
    }
  };

  // 🔹 Logout function
  const handleLogout = async () => {
    try {
      await api.post("/api/logout");  // ✅ Clear session from backend
      await AsyncStorage.clear();  // ✅ Clear session from storage
      navigation.replace("Login");  
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert("Error", "Failed to logout. Try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.logo}>Annotator App</Text>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="home" size={20} color="#333" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.navItem}>
          <Icon name="log-out" size={20} color="#d9534f" />
          <Text style={[styles.navText, { color: "#d9534f" }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TextInput style={styles.searchBar} placeholder="Search..." placeholderTextColor="#aaa" />
          <Text>Welcome, {username || "User"}</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="user" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={folders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openFolder(item.id)} style={styles.folderContainer}>
              <Icon name="folder" size={60} color="#007EE5" />
              <Text style={styles.folderText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          numColumns={2} 
          contentContainerStyle={styles.flatListContent}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", backgroundColor: "#fff" },
  sidebar: { width: 250, backgroundColor: "#f8f8f8", padding: 20, borderRightWidth: 1, borderRightColor: "#ddd" },
  logo: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  navItem: { flexDirection: "row", alignItems: "center", padding: 15 },
  navText: { marginLeft: 10, fontSize: 16 },
  mainContent: { flex: 1, padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", padding: 10, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  searchBar: { width: "60%", backgroundColor: "#eee", padding: 8, borderRadius: 5 },
  iconButton: { padding: 5 },
  folderContainer: {
    width: "45%", 
    height: 150,
    margin: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
  },
  folderText: { fontSize: 14, marginTop: 10 },
  flatListContent: { justifyContent: "space-around", paddingVertical: 20 },
});

export default AnnotatorScreen;
