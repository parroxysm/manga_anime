import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      const data = await AsyncStorage.getItem('favorites');
      const rawFavIds = data ? JSON.parse(data) : [];
      const favIds = [...new Set(rawFavIds.map((id) => String(id)).filter((id) => id && id !== 'undefined' && id !== 'null'))];

      setFavorites(favIds);
      await AsyncStorage.setItem('favorites', JSON.stringify(favIds));
      fetchFavorites(favIds);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const fetchFavorites = async (favIds) => {
    try {
      setLoading(true);

      if (!favIds.length) {
        setCharacters([]);
        return;
      }

      const results = await Promise.all(
        favIds.map(async (id) => {
          const res = await fetch(`https://api.jikan.moe/v4/characters/${id}`);
          const json = await res.json();
          return json?.data;
        })
      );

      const validCharacters = results
        .filter((character) => character && character.mal_id)
        .map((character) => ({
          id: character.mal_id.toString(),
          name: character.name || 'Unknown',
          image: character.images?.jpg?.image_url || 'https://placehold.co/300x400?text=No+Image',
          about: character.about?.trim() || 'No description available.',
        }));

      setCharacters(validCharacters);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id) => {
    let allFavorites = [];
    try {
      const stringId = String(id);
      const data = await AsyncStorage.getItem('favorites');
      const currentFavorites = data
        ? [...new Set(JSON.parse(data).map((favId) => String(favId)))]
        : [];
      allFavorites = currentFavorites.includes(stringId)
        ? currentFavorites.filter((favId) => favId !== stringId)
        : [...currentFavorites, stringId];
        for(let i = id; i < allFavorites.length; i++) {
          allFavorites[i] = allFavorites[i + 1];
          }
      setFavorites(allFavorites);
      await AsyncStorage.setItem('favorites', JSON.stringify(allFavorites));
      fetchFavorites(allFavorites);
    } catch (error) {
      console.log(error);
    }

  };
  if (loading) {
    return (
      <View style={ styles.background }>
        <ActivityIndicator size="large" color="gold" />
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <FlatList 
        data={characters} 
        keyExtractor={(item) => item.id}
        onRefresh={() => loadFavorites()}
        refreshing={loading}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.itemsCard} 
            onPress={() => {
              router.push({
                pathname: '/DetailsScreen',
                params: { 
                  name: item.name, 
                  image: item.image, 
                  about: item.about 
                }
              });
            }}
          >
            <Image 
              source={{ uri: item.image }} 
              style={styles.imageAnimeCard} 
            />
            <View style={styles.infoAnimeCard}>
              <View style={ styles.nameAndFavoriteContainer }>
                <Text style={styles.titluAnimeCard}>{item.name}</Text>
                <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                  <Ionicons name={favorites.includes(item.id) ? "heart" : "heart-outline"} size={30} color={favorites.includes(item.id) ? "gold" : "#ccc"}/>
                </TouchableOpacity>
              </View>
              <Text style={styles.informatiiAnimeCard} numberOfLines={3}>
                {item.about}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  background: { 
    flex: 1, 
    backgroundColor: '#1E1E1E', 
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    marginTop: 50,
  },
  itemsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 12,
    marginRight: 12,
    marginBottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imageAnimeCard: {
    height: 120,
    width: 90,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  infoAnimeCard: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  titluAnimeCard: {
    color: 'gold',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5
  },
  informatiiAnimeCard: {
    color: '#bbb',
    fontSize: 13,
    lineHeight: 18,
  },
  AnimePageHeaderStyle: {
    backgroundColor: '#1E1E1E',
  },
  nameAndFavoriteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  favoriteButtonAnimeCard: {
    borderColor: 'gold',
    borderWidth: 1,
    borderRadius: 20,
    width: 30,
    height: 30,
  },
});