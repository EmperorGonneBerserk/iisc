import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import api from "../api"; // Import Axios instance
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const RegistrationScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      console.log("Error", "Please fill in all fields");
      return;
    }

    try {
      const response = await axios.post(`http://127.0.0.1:5000/api/register`, {
        username: firstName,
        email: email,
        password1: password,
        password2: password,
      });

      console.log("Success", "Account created successfully! Please login.");

      // Optionally store user data (if needed)
      await AsyncStorage.setItem("user", JSON.stringify(response.data));

      // Navigate to login screen
      navigation.navigate("Login");
    } catch (error) {
      console.error(
        "Registration Error:",
        error.response?.data || error.message
      );
      console.error("Registration Error:", error.response?.data);
      Alert.alert(
        "Registration Failed",
        error.response?.data?.error || "Something went wrong."
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.registrationContainer}>
        <Text style={styles.title}>Create Account</Text>

        <View style={styles.nameRow}>
          <TextInput
            style={styles.nameInput}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={[styles.nameInput, styles.lastNameInput]}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.createButton} onPress={handleRegister}>
          <Text style={styles.createButtonText}>Create Account</Text>
        </TouchableOpacity>

        <Text style={styles.accountText}>
          Already have an account?{" "}
          <Text
            style={styles.loginLink}
            onPress={() => navigation.navigate("Login")}
          >
            Login
          </Text>
        </Text>

        <TouchableOpacity style={styles.googleButton}>
          <Image
            source={{
              uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg",
            }}
            style={styles.googleLogo}
          />
          <Text style={styles.googleButtonText}>Login using Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
  },
  registrationContainer: {
    backgroundColor: "white",
    width: "100%",
    maxWidth: 600,
    padding: 30,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "blue",
    textAlign: "center",
    marginBottom: 30,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  nameInput: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 50,
    fontSize: 16,
    color: "#333",
    marginRight: 10,
  },
  lastNameInput: {
    marginRight: 0,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 50,
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: "lightblue",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  createButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  accountText: {
    textAlign: "center",
    fontSize: 16,
    color: "#555",
    marginVertical: 10,
  },
  loginLink: {
    color: "blue",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 20,
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    color: "#333",
  },
});

export default RegistrationScreen;
