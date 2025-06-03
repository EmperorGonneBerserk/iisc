import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Screens
import HomeScreen from "./Screens/HomeScreen";
import ImageScreen from "./Screens/ImageScreen";
import LoginScreen from "./Screens/LoginScreen";
import RegisterScreen from "./Screens/RegistrationScreen";
import AnnotatorScreen from "./Screens/AnnotatorScreen";
import AnnotationImageScreen from "./Screens/AnnotationImageScreen";
import VerifierScreen from "./Screens/VerifierScreen";
import VerifierImageScreen from "./Screens/VerifierImageScreen";
import AnnotatedScreen from "./Screens/AnnotatedScreen";
import SuperUserScreen from "./Screens/SuperUserScreen";
import AssignImageScreen from "./Screens/AssignImageScreen";
import VerifiedScreen from "./Screens/VerifiedScreen";
import RejectedScreen from "./Screens/RejectedScreen";
import Hello from "./Screens/Hello";
// import dummy from "./Screens/dummy";

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkUserSession = async () => {
    
        const token = await AsyncStorage.getItem("accessToken");
        const role = await AsyncStorage.getItem("user_role");
        console.log("Token:", token);
        console.log("Role:", role);
        
        setInitialRoute("Login");
      
    };

    checkUserSession();
  }, []);

  if (!initialRoute) return null; // Or show a loading spinner

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: true }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="VerifierScreen" component={VerifierScreen} />
        <Stack.Screen name="Annotated" component={AnnotatedScreen} />
        <Stack.Screen name="AnnotatorScreen" component={AnnotatorScreen} />
        <Stack.Screen name="SuperUserScreen" component={SuperUserScreen} />
        <Stack.Screen name="Hello" component={Hello} />
        <Stack.Screen name="ImageScreen" component={ImageScreen} />
        <Stack.Screen name="AnnotationImageScreen" component={AnnotationImageScreen}/>
        <Stack.Screen name="VerifierImageScreen" component={VerifierImageScreen}/>
        <Stack.Screen name="Assigned" component={AssignImageScreen} />
        <Stack.Screen name="Verified" component={VerifiedScreen} />
        <Stack.Screen name="Rejected" component={RejectedScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
