import { useLocalSearchParams } from "expo-router";
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

export default function DetailsScreen(){
    const item = useLocalSearchParams();

    return (
        <View style={styles.background}>
            <ScrollView>
                <Image source={{ uri: item.image as string }} style={styles.imageAnimeCard} />
                <View style={styles.content}>
                    <Text style={styles.nameAnimeCard}>{item.name}</Text>
                    <Text style={styles.aboutAnimeCard}>{item.about}</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
  background: { 
    flex: 1, 
    backgroundColor: '#1E1E1E'
},
  imageAnimeCard: {
    borderRadius: 27,
    marginTop: "10%",
    alignSelf: 'center',
    width: '90%', 
    height: 350, 
    resizeMode: 'cover' 
},
  content: { 
    padding: 20 
},
  nameAnimeCard: { 
    color: 'white',
    alignSelf: 'center', 
    fontSize: 40, 
    fontWeight: 'bold', 
    padding: 5
},
  aboutAnimeCard: {
    alignSelf: 'center', 
    color: 'white', 
    fontSize: 18, 
    lineHeight: 22,
    padding: 5
}
});