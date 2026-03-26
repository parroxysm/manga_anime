import { useLocalSearchParams } from "expo-router";
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

const CULORI = {
  fundal: '#1E1E1E',
  auriu: 'gold',
  alb: 'white',
  griText: '#bbb',
  cardBordura: 'rgba(255, 255, 255, 0.1)'
};

export default function DetailsScreen() {
  const item = useLocalSearchParams();

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
  }
});