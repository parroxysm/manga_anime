import { View, Text, StyleSheet, Image } from "react-native";
import React from 'react';
import { useLocalSearchParams } from "expo-router";

export default function DetailsScreen(){
    const item = useLocalSearchParams();

    return (
        <View>
            <Image source={{ uri: item.image as string }} style={styles.fullImage} />
            <View style={styles.content}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.about}>{item.about}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  fullImage: { width: '100%', height: 300, resizeMode: 'cover' },
  content: { padding: 20 },
  name: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  about: { color: '#ccc', fontSize: 16, lineHeight: 22 }
});