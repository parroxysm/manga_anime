import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import IP from '../var/IP';

const CULORI = {
  fundal: '#1E1E1E',
  auriu: 'gold',
  alb: 'white',
  griText: '#bbb',
  griInput: '#2A2A2A',
  rosuEroare: '#ff4444',
  cardBordura: '#414141',
  butonText: '#000'
};

export default function SignUpScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    // Validări simple pe telefon
    if (!username || !password || !confirmPassword) {
      setErrorMessage("Please fill in all fields.");
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${IP}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password,
          confirmpassword: confirmPassword 
        })
      });
      
      const data = await response.json();

      if (data.success) {
        // Dacă a mers, îl trimitem înapoi la Login
        router.replace('/logInScreen');
      } else {
        setErrorMessage("Username already exists or registration failed.");
      }
    } catch (error) {
      console.log(error);
      setErrorMessage("Network error. Please try again.");
    } 
  };

  return (
    <View style={styles.container}>
      <View style={styles.containerSignUpBox}>
        <Text style={styles.signUpHeader}>Create Account</Text>
        <Text style={styles.signUpSubHeader}>Join us and save your favorites</Text>
        
        <TextInput 
          style={styles.input}
          placeholder='Username'
          placeholderTextColor="#666"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder='Password'
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder='Confirm Password'
          placeholderTextColor="#666"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {errorMessage !== '' && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}

        <TouchableOpacity style={styles.signUpButton} onPress={handleRegister}>
          <Text style={styles.signUpButtonText}>Register</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.containerLogInSwitch}>
        <Text style={{color: CULORI.griText}}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.logInText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CULORI.fundal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerSignUpBox: {
    width: '85%',
    padding: 25,
    borderWidth: 1,
    borderRadius: 24,
    borderColor: CULORI.cardBordura,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  signUpHeader: {
    fontSize: 32,
    color: CULORI.auriu,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  signUpSubHeader: {
    fontSize: 14,
    color: CULORI.griText,
    alignSelf: 'center',
    marginBottom: 30,
  },
  input: {
    height: 55,
    backgroundColor: CULORI.griInput,
    borderRadius: 12,
    paddingHorizontal: 15,
    color: CULORI.alb,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  errorText: {
    color: CULORI.rosuEroare,
    alignSelf: 'center',
    marginBottom: 10,
    fontSize: 13,
    textAlign: 'center',
  },
  signUpButton: {
    backgroundColor: CULORI.auriu,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: CULORI.butonText,
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
    color: CULORI.auriu,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});