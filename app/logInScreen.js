import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import IP from "../var/IP";
import { LIGHT, DARK } from "../var/Culori";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [checkExisted, setCheckExisted] = useState(null);
  const [theme, setTheme] = useState(LIGHT);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("isDarkTheme").then((val) => {
        setTheme(val === "true" ? DARK : LIGHT);
      });
    }, []),
  );

  const handleLogin = async () => {
    try {
      const response = await fetch(`${IP}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem("userId", data.userId.toString());
        await AsyncStorage.setItem("username", username.trim());
        router.replace("/");
      } else {
        setCheckExisted(false);
      }
    } catch (error) {
      setCheckExisted(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.fundal }]}>
      <View
        style={[
          styles.containerLogIn,
          { backgroundColor: theme.card, borderColor: theme.bordura },
        ]}
      >
        <Text style={[styles.logInHeader, { color: theme.accent }]}>
          Welcome
        </Text>
        <Text style={[styles.logInSubHeader, { color: theme.textSecundar }]}>
          Log in to your account
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              color: theme.text,
              borderColor: theme.bordura,
            },
          ]}
          placeholder="Username"
          placeholderTextColor={theme.textSecundar}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              color: theme.text,
              borderColor: theme.bordura,
            },
          ]}
          placeholder="Password"
          placeholderTextColor={theme.textSecundar}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {checkExisted === false && (
          <Text style={[styles.errorText, { color: theme.danger }]}>
            Invalid username or password
          </Text>
        )}
        <TouchableOpacity
          style={[styles.logInButton, { backgroundColor: theme.accent }]}
          onPress={handleLogin}
        >
          <Text style={[styles.logInButtonText, { color: theme.fundal }]}>
            Log In
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.containerSignUp}>
        <Text style={{ color: theme.textSecundar }}>
          Don't have an account?
        </Text>
        <TouchableOpacity onPress={() => router.push("/SignUpScreen")}>
          <Text style={[styles.signUpText, { color: theme.accent }]}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  containerLogIn: {
    width: "85%",
    padding: 25,
    borderWidth: 1,
    borderRadius: 24,
    elevation: 2,
  },
  logInHeader: {
    fontSize: 32,
    alignSelf: "center",
    fontWeight: "bold",
  },
  logInSubHeader: {
    fontSize: 14,
    alignSelf: "center",
    marginBottom: 30,
  },
  input: {
    height: 55,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  errorText: {
    alignSelf: "center",
    marginBottom: 10,
    fontSize: 13,
  },
  logInButton: {
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  logInButtonText: { fontSize: 18, fontWeight: "bold" },
  containerSignUp: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    gap: 5,
  },
  signUpText: { fontWeight: "bold", textDecorationLine: "underline" },
});
