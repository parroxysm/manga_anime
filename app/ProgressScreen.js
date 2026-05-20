  import Ionicons from '@expo/vector-icons/Ionicons';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { useFocusEffect } from '@react-navigation/native';
  import React, { useCallback, useState } from 'react';
  import {
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert, 
  } from 'react-native';
  import { CULORI } from '../var/Culori';

  export default function ProgressScreen() {
    const [trackedItems, setTrackedItems] = useState([]);

    const loadTrackedItems = async () => {
      try {
        const storedData = await AsyncStorage.getItem('trackedItems');
        if (storedData) {
          setTrackedItems(JSON.parse(storedData));
        }
      } catch (error) {
        console.log("Could not load progress!", error);
      }
    };

    useFocusEffect(
      useCallback(() => {
        loadTrackedItems();
      }, [])
    );

    const saveTrackedItems = async (newItems) => {
      setTrackedItems(newItems);
      try {
        await AsyncStorage.setItem('trackedItems', JSON.stringify(newItems));
      } catch (error) {
        console.log("Error! Could not save progress", error);
      }
    };

    const updateProgress = (id, increment) => {
      const newItems = trackedItems.map(item => {
        if (item.id === id) {
          let newCurrent = item.current + increment;
          if (newCurrent < 0) newCurrent = 0;
          if (item.total && newCurrent > item.total) newCurrent = item.total;
          
          return { ...item, current: newCurrent };
        }
        return item;
      });
      saveTrackedItems(newItems);
    };

    const removeItem = (id, title) => {
      Alert.alert(
        "Delete",
        `Are you sure you want to delete your progress for ${title}?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            style: "destructive",
            onPress: () => {
              const newItems = trackedItems.filter(item => item.id !== id);
              saveTrackedItems(newItems);
            }
          }
        ]
      );
    };

    return (
      <View style={styles.background}>
        <Text style={styles.pageTitle}>My Progress</Text>
        
        <FlatList
          data={trackedItems}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No progress tracked yet.</Text>
          }
          renderItem={({ item }) => {
            const progressPercent = item.total ? Math.min((item.current / item.total) * 100, 100) : 0;

            return (
              <View style={styles.card}>
                <Image source={{ uri: item.image }} style={styles.image} />
                
                <View style={styles.infoContainer}>
                  <View style={styles.headerRow}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <TouchableOpacity onPress={() => removeItem(item.id, item.title)}>
                      <Ionicons name="trash-outline" size={20} color={CULORI.favorite} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.subtitle}>
                    {item.type === 'Anime' ? 'Episodes' : 'Chapters'}: <Text style={{color: CULORI.text}}>{item.current}</Text> / {item.total || '?'}
                  </Text>

                  <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  </View>

                  <View style={styles.controlsContainer}>
                    <TouchableOpacity 
                      style={[styles.controlButton, item.current === 0 && styles.controlButtonDisabled]} 
                      onPress={() => updateProgress(item.id, -1)}
                      disabled={item.current === 0}
                    >
                      <Ionicons name="remove" size={24} color={item.current === 0 ? CULORI.griSeparator : CULORI.auriu} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.controlButton, (item.total && item.current >= item.total) && styles.controlButtonDisabled]} 
                      onPress={() => updateProgress(item.id, 1)}
                      disabled={item.total && item.current >= item.total}
                    >
                      <Ionicons name="add" size={24} color={(item.total && item.current >= item.total) ? CULORI.griSeparator : CULORI.auriu} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    background: {
      flex: 1,
      backgroundColor: CULORI.fundal,
      paddingTop:  StatusBar.currentHeight, 
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: CULORI.auriu,
      textAlign: 'center',
      marginBottom: 15,
    },
    card: {
      flexDirection: 'row',
      backgroundColor: CULORI.cardFundal,
      borderWidth: 1,
      borderColor: CULORI.cardBordura,
      borderRadius: 12,
      marginHorizontal: 15,
      marginBottom: 15,
      padding: 10,
    },
    image: {
      width: 80,
      height: 110,
      borderRadius: 8,
      backgroundColor: CULORI.griSeparator,
    },
    infoContainer: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'space-between',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: 'bold',
      color: CULORI.auriu,
      marginRight: 10,
    },
    subtitle: {
      fontSize: 13,
      color: CULORI.griText,
      marginTop: 4,
      marginBottom: 8,
    },
    progressBarBackground: {
      height: 8,
      backgroundColor: '#E5E0D8',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 10,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#3C364F',
      borderRadius: 4,
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 10,
    },
    controlButton: {
      width: 40,
      height: 35,
      backgroundColor: CULORI.butonFundal,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: CULORI.borduraNav,
    },
    controlButtonDisabled: {
      backgroundColor: 'transparent',
      borderColor: CULORI.addDisabled,
    },
    emptyText: {
      color: CULORI.griText,
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16,
      paddingHorizontal: 20,
    }
  });