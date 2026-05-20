import { useLocalSearchParams } from "expo-router";
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { CULORI } from '../var/Culori';

export default function DetailsScreen() {
  const item = useLocalSearchParams();

  const adaugaLaProgres = async () => {
    try {
      const savedData = await AsyncStorage.getItem('trackedItems');
      let currentList = savedData ? JSON.parse(savedData) : [];

      const alreadyExists = currentList.some((trackedItem: { title: string }) => trackedItem.title === item.name);

      if (alreadyExists) {
        Alert.alert("Notice", "This title is already in your progress tracker.");
        return;
      }
      const totalValue = item.total ? Number(item.total) : null;
      const itemType = item.type === 'manga' ? 'Manga' : 'Anime';

      const obiectNou = {
        id: item.name,         
        title: item.name,      
        type: itemType, 
        image: item.image,     
        current: 0,
        total: totalValue 
      };

      currentList.push(obiectNou);
      await AsyncStorage.setItem('trackedItems', JSON.stringify(currentList));

      Alert.alert("Success!", `${item.name} has been added to your progress tracker.`);

    } catch (error) {
      console.log("Error adding to progress tracker:", error);
    }
  };

  return (
    <View style={styles.background}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image 
          source={{ uri: item.image as string }} 
          style={styles.imageAnimeCard} 
        />
        <View style={styles.content}>
          <Text style={styles.nameAnimeCard}>{item.name}</Text>
          <View style={styles.separator} />
          
          <Text style={styles.aboutAnimeCard}>{item.about}</Text>

          {/* Butonul apare DOAR dacă elementul nu este un personaj */}
          {item.type !== 'characters' && (
            <TouchableOpacity 
              style={styles.butonProgres}
              onPress={adaugaLaProgres}
            >
              <Text style={styles.textButonProgres}>+ Add to your list</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { 
    flex: 1, 
    backgroundColor: CULORI.fundal
  },
  imageAnimeCard: {
    borderRadius: 20,
    marginTop: 20,
    alignSelf: 'center',
    width: '92%', 
    height: 400, 
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: CULORI.cardBordura
  },
  content: { 
    padding: 20 
  },
  nameAnimeCard: { 
    color: CULORI.auriu,
    textAlign: 'center', 
    fontSize: 32, 
    fontWeight: 'bold', 
    marginBottom: 10
  },
  separator: {
    height: 2,
    backgroundColor: CULORI.auriu,
    width: 60,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 1
  },
  aboutAnimeCard: {
    color: CULORI.alb, 
    fontSize: 16, 
    lineHeight: 24,
    textAlign: 'justify'
  },

  butonProgres: {
    backgroundColor: CULORI.butonFundal,
    borderColor: CULORI.auriu,
    borderWidth: 1,
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    marginBottom: 20, 
    alignItems: 'center',
  },
  textButonProgres: {
    color: CULORI.auriu, 
    fontWeight: 'bold', 
    fontSize: 16
  }
});