import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import IP from '../var/IP';
import { LIGHT, DARK } from '../var/Culori';

export default function SignUpScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [theme, setTheme] = useState(LIGHT);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeout = useRef(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('isDarkTheme').then(val => {
        setTheme(val === 'true' ? DARK : LIGHT);
      });
    }, [])
  );

  const showToast = (message) => {
    setToastMessage(message);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMessage(''), 3000);
  };

  const handleRegister = async () => {
    if (!username || !password || !confirmPassword) return showToast("Please fill in all fields.");
    if (password !== confirmPassword) return showToast("Passwords do not match.");
    if (password.length < 8) return showToast("Password must be at least 8 characters.");

    try {
      const response = await fetch(`${IP}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ username: username.trim(), password, confirmpassword: confirmPassword })
      });
      const data = await response.json();
      if (data.success) {
        router.replace('/logInScreen');
      } else {
        showToast("Username already exists or failed.");
      }
    } catch (error) {
      showToast("Network error. Please try again.");
    } 
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.fundal }]}>
      <View style={[styles.containerSignUpBox, { backgroundColor: theme.card, borderColor: theme.bordura }]}>
        <Text style={[styles.signUpHeader, { color: theme.accent }]}>Create Account</Text>
        <Text style={[styles.signUpSubHeader, { color: theme.textSecundar }]}>Join us and save your favorites</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.bordura }]}
          placeholder='Username'
          placeholderTextColor={theme.textSecundar}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.bordura }]}
          placeholder='Password'
          placeholderTextColor={theme.textSecundar}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.bordura }]}
          placeholder='Confirm Password'
          placeholderTextColor={theme.textSecundar}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <TouchableOpacity style={[styles.signUpButton, { backgroundColor: theme.accent }]} onPress={handleRegister}>
          <Text style={[styles.signUpButtonText, { color: theme.fundal }]}>Register</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.containerLogInSwitch}>
        <Text style={{color: theme.textSecundar}}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.logInText, { color: theme.accent }]}>Log In</Text>
        </TouchableOpacity>
      </View>

      {toastMessage !== '' && (
        <View style={[styles.toastContainer, { backgroundColor: theme.accent }]}>
          <Text style={[styles.toastText, { color: theme.fundal }]}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerSignUpBox: {
    width: '85%',
    padding: 25,
    borderWidth: 1,
    borderRadius: 24,
    elevation: 2,
  },
  signUpHeader: {
    fontSize: 32,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  signUpSubHeader: {
    fontSize: 14,
    alignSelf: 'center',
    marginBottom: 30,
  },
  input: {
    height: 55,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  signUpButton: {
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  containerLogInSwitch: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 5,
  },
  logInText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 5,
    zIndex: 1000,
  },
  toastText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});