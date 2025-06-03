import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import Icon from "react-native-vector-icons/Feather";
import { Picker } from "@react-native-picker/picker";

const annotators = [
  { id: "a1", name: "Annotator 1" },
  { id: "a2", name: "Annotator 2" },
];

const initialUsers = [
  {
    id: "u1",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "Annotator",
  },
  { id: "u2", name: "Bob Smith", email: "bob@example.com", role: "Verifier" },
  {
    id: "u3",
    name: "Carol Lee",
    email: "carol@example.com",
    role: "Annotator",
  },
  { id: "u4", name: "David Kim", email: "david@example.com", role: "Verifier" },
  { id: "u5", name: "Eva Wong", email: "eva@example.com", role: "Annotator" },
];

export default function dummy({ navigation }) {
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedAnnotator, setSelectedAnnotator] = useState(null);
  const [users, setUsers] = useState(initialUsers);

  const pickImages = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        const selected = result.assets || [result];
        const newImages = [];

        for (const asset of selected) {
          const newPath = FileSystem.documentDirectory + asset.fileName;
          await FileSystem.copyAsync({ from: asset.uri, to: newPath });
          newImages.push({
            id: Date.now().toString() + Math.random(),
            uri: newPath,
          });
        }

        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const toggleSelectImage = (id) => {
    setSelectedImages((prev) =>
      prev.includes(id) ? prev.filter((imgId) => imgId !== id) : [...prev, id]
    );
  };

  const assignImages = () => {
    if (!selectedAnnotator) return Alert.alert("Please select an annotator");
    if (selectedImages.length === 0) return Alert.alert("No images selected");

    Alert.alert(
      "Assigned",
      `Assigned ${selectedImages.length} image(s) to ${selectedAnnotator.name}`
    );
    setSelectedImages([]);
  };

  const updateUserRole = (userId, newRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const deleteUser = (userId) => {
    Alert.alert("Delete User", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setUsers((prev) => prev.filter((u) => u.id !== userId)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Super User Dashboard</Text>
      </View>

      <View style={styles.content}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Assign Images</Text>
          {annotators.map((annotator) => (
            <TouchableOpacity
              key={annotator.id}
              style={[
                styles.annotatorBtn,
                selectedAnnotator?.id === annotator.id &&
                  styles.annotatorBtnActive,
              ]}
              onPress={() => setSelectedAnnotator(annotator)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.annotatorText,
                  selectedAnnotator?.id === annotator.id &&
                    styles.annotatorTextActive,
                ]}
              >
                {annotator.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.assignButton} onPress={assignImages}>
            <Text style={styles.assignButtonText}>Assign Selected</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.assignButton, { marginTop: 20 }]}
            onPress={pickImages}
          >
            <Text style={styles.assignButtonText}>Upload Images</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.sectionTitle}>Folders</Text>
          <View style={styles.folderRow}>
            {["All Images", "Accepted", "Rejected"].map((name) => (
              <View key={name} style={styles.folderContainer}>
                <Image
                  source={require("../assets/hello.jpeg")} // Mac-style folder icon
                  style={styles.folderIcon}
                />
                <Text style={styles.folderLabel}>{name}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Uploaded Images</Text>
          <ScrollView contentContainerStyle={styles.imagesContainer}>
            {images.map((img) => {
              const isSelected = selectedImages.includes(img.id);
              return (
                <TouchableOpacity
                  key={img.id}
                  style={[
                    styles.imageContainer,
                    isSelected && styles.imageSelected,
                  ]}
                  onPress={() => toggleSelectImage(img.id)}
                >
                  <Image source={{ uri: img.uri }} style={styles.image} />
                  {isSelected && (
                    <View style={styles.checkOverlay}>
                      <Icon name="check-circle" size={20} color="#007AFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.userManagementTitle}>User Management</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.cellLarge]}>Name</Text>
            <Text style={styles.tableCell}>Email</Text>
            <Text style={styles.tableCell}>Role</Text>
            <Text style={[styles.tableCell, { flex: 0.6 }]}>Delete</Text>
          </View>
          <ScrollView>
            {users.map((user) => (
              <View key={user.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.cellLarge]}>
                  {user.name}
                </Text>
                <Text style={styles.tableCell}>{user.email}</Text>
                <View style={[styles.tableCell, styles.rolePickerContainer]}>
                  <Picker
                    selectedValue={user.role}
                    style={styles.rolePicker}
                    onValueChange={(val) => updateUserRole(user.id, val)}
                    mode="dropdown"
                  >
                    <Picker.Item label="Annotator" value="Annotator" />
                    <Picker.Item label="Verifier" value="Verifier" />
                  </Picker>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteUser(user.id)}
                >
                  <Icon name="trash-2" size={20} color="#d32f2f" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#f5f5f5",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  content: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 250,
    backgroundColor: "#fafafa",
    padding: 20,
    borderRightColor: "#e0e0e0",
    borderRightWidth: 1,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  annotatorBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  annotatorBtnActive: {
    backgroundColor: "#e6f0ff",
    borderColor: "#007AFF",
  },
  annotatorText: {
    textAlign: "center",
    color: "#333",
    fontWeight: "500",
  },
  annotatorTextActive: {
    color: "#007AFF",
  },
  assignButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  assignButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginVertical: 14,
  },
  folderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  folderContainer: {
    alignItems: "center",
    width: 90,
  },
  folderIcon: {
    width: 60,
    height: 50,
    resizeMode: "contain",
    marginBottom: 6,
  },
  folderLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 30,
  },
  imageContainer: {
    width: "47%",
    height: 150,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
    position: "relative",
  },
  imageSelected: {
    borderColor: "#007AFF",
    borderWidth: 2,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  checkOverlay: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 2,
  },
  userManagementTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginVertical: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    paddingVertical: 10,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingVertical: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 14,
    color: "#333",
  },
  cellLarge: {
    flex: 2,
  },
  rolePickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    overflow: "hidden",
  },
  rolePicker: {
    height: 36,
    width: "100%",
    color: "#333",
  },
  deleteButton: {
    flex: 0.6,
    alignItems: "center",
    justifyContent: "center",
  },
});
