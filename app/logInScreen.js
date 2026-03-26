import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [checkExisted, setCheckExisted] = useState(null);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await fetch('http://192.168.1.133:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem("userId", data.userId.toString());
        router.replace('/App');
      } else {
        setCheckExisted(false);
      }
    } catch (error) {
      console.log(error);
      setCheckExisted(false);
    } 
  };

  return (
    <View style={styles.container}>
      {/* Log In container */}
      <View style={styles.containerLogIn}>
        <Text style={styles.logInHeader}>Welcome</Text>
        <Text style={styles.logInSubHeader}>Log in to your account</Text>
        
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

        {checkExisted === false && (
          <Text style={styles.errorText}>
            Invalid username or password
          </Text>
        )}

        <TouchableOpacity style={styles.logInButton} onPress={handleLogin}>
          <Text style={styles.logInButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Up container */}
      <View style={styles.containerSignUp}>
        <Text style={{color: CULORI.griText}}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => console.log("Navigate to SignUp")}>
          <Text style={styles.signUpText}>Sign Up</Text>
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
  containerLogIn: {
    width: '85%',
    padding: 25,
    borderWidth: 1,
    borderRadius: 24,
    borderColor: CULORI.cardBordura,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  logInHeader: {
    fontSize: 32,
    color: CULORI.auriu,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  logInSubHeader: {
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
  },
  logInButton: {
    backgroundColor: CULORI.auriu,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  logInButtonText: {
    color: CULORI.butonText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  containerSignUp: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 5,
  },
  signUpText: {
    color: CULORI.auriu,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});