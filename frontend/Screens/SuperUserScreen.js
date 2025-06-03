import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Button, StyleSheet, Alert } from 'react-native';

export default function SuperUserScreen({ navigation }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/superuserrr2/')
      .then(res => res.json())
      .then(data => setUsers(data.users))
      .catch(error => console.error('Fetch Error:', error));
  }, []);

  const changeRole = (userId, newRole) => {
    const formData = new FormData();
    formData.append("action", "update");
    formData.append("user_id", userId);
    formData.append("role", newRole);

    fetch('http://127.0.0.1:5000/api/superuserrr2/', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      Alert.alert("Role Updated", data.message);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    });
  };

  const deleteUser = (userId) => {
    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("user_id", userId);

    fetch('http://127.0.0.1:5000/api/superuserrr2/', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      Alert.alert("Deleted", data.message);
      setUsers(prev => prev.filter(u => u.id !== userId));
    });
  };
  const handlePress = (folder) => {
    // Place custom logic for each folder here if needed
    if (folder === "Assigned") {
      console.log("Navigating to Assigned Folder");
      window.location.href = 'http://127.0.0.1:5000/super2/';
    }
    else if (folder === "Annotators") {
      console.log("Navigating to Annotators Folder");
      navigation.navigate("Assigned"); 
    }
     else if (folder === "Verified") {
      console.log("Navigating to Verified Folder");
    } else if (folder === "Rejected") {
      console.log("Navigating to Rejected Folder");
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Super User Panel</Text>

      {/* Folder Buttons */}
      <View style={styles.folderContainer}>
        {["Assigned","Annotators","Verified", "Rejected"].map(folder => (
          <TouchableOpacity
            key={folder}
            style={styles.folderButton}
            onPress={() => handlePress(folder)}
          >
            <Text style={styles.folderText}>{folder}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User List */}
      <FlatList
        data={users}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <Text>{item.username} ({item.role})</Text>
            <View style={styles.buttonRow}>
              <Button title="Make Annotator" onPress={() => changeRole(item.id, "annotator")} />
              <Button title="Make Verifier" onPress={() => changeRole(item.id, "verifier")} />
              <Button title="Delete" color="red" onPress={() => deleteUser(item.id)} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  folderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  folderButton: {
    backgroundColor: '#1e40af',
    padding: 10,
    borderRadius: 8
  },
  folderText: {
    color: 'white',
    fontSize: 16
  },
  userCard: {
    padding: 10,
    backgroundColor: '#f3f4f6',
    marginVertical: 5,
    borderRadius: 6
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  }
});
