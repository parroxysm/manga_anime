import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Animated, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ionicons } from '@expo/vector-icons';
import { LIGHT, DARK } from '../var/Culori';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export default function AiChatScreen() {
  const [theme, setTheme] = useState(LIGHT);
  const [messages, setMessages] = useState([
    { id: '1', text: "Hello! I'm your anime and manga guide. Ask me anything!", sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('isDarkTheme').then(val => {
        setTheme(val === 'true' ? DARK : LIGHT);
      });
    }, [])
  );

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const userMsg = { id: Date.now().toString(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `You are a helpful, extremely knowledgeable anime and manga assistant. Answer this query: ${userMsg.text}`;
      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: aiResponse, sender: 'ai' }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: "Connection error. Please try again.", sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? [styles.userBubble, { backgroundColor: theme.accent }] : [styles.aiBubble, { backgroundColor: theme.card, borderColor: theme.bordura }]]}>
        <Text style={{ color: isUser ? theme.fundal : theme.text }}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.fundal }]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      {loading && <Text style={[styles.loadingText, { color: theme.textSecundar }]}>Typing...</Text>}
      <View style={[styles.inputContainer, { borderTopColor: theme.bordura, backgroundColor: theme.fundal }]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.bordura }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about anime, manga..."
          placeholderTextColor={theme.textSecundar}
        />
        <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.accent }]} onPress={sendMessage}>
          <Ionicons name="send" size={20} color={theme.fundal} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  chatList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  loadingText: {
    marginLeft: 20,
    marginBottom: 10,
    fontStyle: 'italic',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 45,
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});