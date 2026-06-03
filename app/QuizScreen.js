import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import IP from '../var/IP';
import { LIGHT, DARK } from '../var/Culori';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const QUESTIONS = [
  "If you found a dropped wallet with a lot of money but no ID, what would you do?",
  "How do you handle failure or a major setback in your life?",
  "Are rules meant to be strictly followed, or are they guidelines meant to be bent when necessary?",
  "When faced with an overwhelmingly stronger opponent or problem, what is your strategy?",
  "How do you behave in a group project when others are not doing their part?",
  "What is your ultimate goal in life, and what sacrifices are you willing to make for it?",
  "Do you prefer the comfort of the known or the thrill of the unknown?",
  "How do you handle betrayal from a close friend?",
  "What role does empathy play in your day-to-day decision-making?",
  "If you could have one superpower, what would it be and how exactly would you use it?",
  "How do you process grief or the loss of something profoundly important to you?",
  "Do you genuinely believe that the end justifies the means?",
  "How do you usually show affection or appreciation to those you deeply care about?",
  "When given a leadership role, how do you inspire and manage your team?",
  "What is your greatest fear, and how do you try to overcome it?"
];

export default function QuizScreen() {
  const router = useRouter();
  const [theme, setTheme] = useState(LIGHT);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('isDarkTheme').then(val => {
        setTheme(val === 'true' ? DARK : LIGHT);
      });
    }, [])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentQuestionIndex]);

  const handleNext = () => {
    if (!currentAnswer.trim()) return;
    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      fadeAnim.setValue(0);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      generateResult(newAnswers);
    }
  };

  const generateResult = async (finalAnswers) => {
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      let prompt = "Analyze the following psychological answers and determine which anime or manga character (male or female) this person is most like. Give a balanced mix of popular and niche characters. Return ONLY a valid JSON object with the following structure: {\"character\": \"Name\", \"anime\": \"Anime Name\", \"reason\": \"A short explanation\"}. Do not include markdown formatting.\n\n";
      
      QUESTIONS.forEach((q, i) => {
        prompt += `Q: ${q}\nA: ${finalAnswers[i]}\n\n`;
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(responseText);

      let imageUrl = null;
      try {
        const jikanRes = await fetch(`https://api.jikan.moe/v4/characters?q=${parsedData.character}&limit=1`);
        const jikanData = await jikanRes.json();
        if (jikanData.data && jikanData.data.length > 0) {
          imageUrl = jikanData.data[0].images?.jpg?.image_url || null;
        }
      } catch (e) {}

      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        await fetch(`${IP}/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: Number(userId), 
            character: parsedData.character, 
            anime: parsedData.anime, 
            reason: parsedData.reason, 
            image: imageUrl 
          })
        });
      }

      router.back();
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.fundal }]}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.text, marginTop: 20 }}>Analyzing your personality...</Text>
        </View>
      ) : (
        <Animated.View style={[styles.quizContainer, { opacity: fadeAnim }]}>
          <Text style={[styles.counter, { color: theme.textSecundar }]}>
            Question {currentQuestionIndex + 1} of {QUESTIONS.length}
          </Text>
          <Text style={[styles.questionText, { color: theme.text }]}>
            {QUESTIONS[currentQuestionIndex]}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.bordura }]}
            multiline
            placeholder="Type your answer here..."
            placeholderTextColor={theme.textSecundar}
            value={currentAnswer}
            onChangeText={setCurrentAnswer}
          />
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={handleNext}>
            <Text style={[styles.buttonText, { color: theme.fundal }]}>
              {currentQuestionIndex === QUESTIONS.length - 1 ? "Finish" : "Next"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizContainer: {
    flex: 1,
    marginTop: 40,
  },
  counter: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    height: 150,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 30,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});