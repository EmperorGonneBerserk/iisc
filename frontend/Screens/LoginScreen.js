import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { getCsrfToken } from "../api";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    getCsrfToken();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const csrfToken = await getCsrfToken();
      if (!csrfToken) throw new Error("CSRF Token missing");

      const response = await api.post(
        "login",
        { username: email, password: password },
        {
          headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Login successful:", response.data);
      await AsyncStorage.setItem("user_role", response.data.role);
      await AsyncStorage.setItem("accessToken", response.data.accessToken); 
      console.log("user_role", response.data.role);
      Alert.alert("Success", "Login Successful");
      if (response.data.role === 'superuser') {
        navigation.replace('SuperUserScreen');
      } else if (response.data.role === 'annotator') {
        navigation.replace('AnnotatorScreen');
      } else if (response.data.role === 'verifier') {
        navigation.replace('VerifierScreen');
      } else {
        Alert.alert('Unknown Role', 'User role not recognized.');
      }
    } catch (error) {
      console.error("Login Failed:", error.response?.data || error.message);
      Alert.alert(
        "Login Failed",
        error.response?.data?.error || "Something went wrong"
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.registrationContainer}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Username or Email"
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

        <TouchableOpacity style={styles.createButton} onPress={handleLogin}>
          <Text style={styles.createButtonText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.accountText}>
          Don’t have an account?{" "}
          <Text
            style={styles.loginLink}
            onPress={() => navigation.navigate("Register")}
          >
            Register
          </Text>
        </Text>
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
});

export default LoginScreen;
