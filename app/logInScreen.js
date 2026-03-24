import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
 

function SignUp() {

}

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [checkExisted, setCheckExisted] = useState(null);
  const router = useRouter();

  const handleLogin = async () => {
    console.log('Attempting to log in with:', username, password);
    try {
      console.log('Sending login request to server...');
      const response = await fetch('http://192.168.0.103:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      console.log("STATUS:", response.status);
      const data = await response.json();
      console.log(data);

      if (data.success) {
        await AsyncStorage.setItem("userId", data.userId.toString());
        router.replace('/App');
      } else {
        setCheckExisted(false);
      }

    }catch (error) {
      console.log(error);
      setCheckExisted(false);
    } 
};

  return (
    <View style={styles.container}>
      {/* Log In container */}
      <View style={ styles.containerLogIn}>
        <Text style={styles.logInText}>Log In</Text>
        <TextInput 
          style={styles.nameInput}
          placeholder='Username'
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.passwordInput}
          placeholder='Password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {checkExisted === false && (
          <Text style={{color: 'red', alignSelf: 'center', marginTop: "15%"}}>
            Invalid username or password
          </Text>
        )}
        <TouchableOpacity style={styles.logInButton} onPress={handleLogin}>
          <Text style={styles.logInButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
      {/* Sign Up container */}
      <View style={styles.containerSignUp}>
        <Text style={{color: '#e6e6e6',}}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => SignUp()}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerLogIn: {
    width: '80%',
    height: "50%",
    borderWidth: 2,
    borderRadius: 24,
    borderColor: '#414141',
    backgroundColor: '#fff',
  },
  logInText: {
    fontSize: 40,
    alignSelf: 'center',
    fontWeight: 'bold',
    marginTop: "10%",
  },
  nameInput: {
    marginTop: "10%",
    marginHorizontal: 20,
    borderWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 18,
  },
  passwordInput: {
    marginTop: "10%",
    marginHorizontal: 20,
    borderWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 18,
  },
  logInButton: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: "10%",
  },
  logInButtonText: {
    alignSelf: 'center',
    backgroundColor: '#c8f0ff',
    fontSize: 20,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: "25%",
    paddingVertical: "5%",
    fontWeight: 'bold',
  },
  containerSignUp: {
    position: 'absolute',
    bottom: "5%",
    flexDirection: 'row',
    gap: 5,
  },
  signUpText: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
});
