import { Ionicons } from '@expo/vector-icons';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FavoritesScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);


  useEffect(() => {
    const init = async () => {
    const uid = await getUserId();
    if(uid) await loadFavorites(uid);
    };

    init();
    console.log("USERID:", userId);
  }, [userId]);
  
  useFocusEffect(
    useCallback(() => {
      loadFavorites(userId);
    }, [userId])
  );

  const getUserId = async () => { 
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const parsed = storedUserId ? Number(storedUserId) : null;
      if(parsed == 0){
        router.replace('/logInScreen');
      }
      setUserId(parsed);

      console.log("USERID:", parsed);
      return parsed;
    } catch (error) { 
      console.log(error);
    }
  };


const loadFavorites = async (uid) => {
  if(!uid) return;
  try {
    const res = await fetch(`http://192.168.x.x:3000/favorites?userId=${uid}`);
    const data = await res.json();

    const favIds = data.favorites.map(f => f.characterId);

    setFavorites(favIds);
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
      .filter(c => c && c.mal_id)
      .map(c => ({
        id: c.mal_id.toString(),
        name: c.name || 'Unknown',
        image: c.images?.jpg?.image_url,
        about: c.about?.trim() || 'No description available.',
      }));

    setCharacters(validCharacters);

  } catch (e) {
    console.log(e);
  } finally {
    setLoading(false);
  }
};

const toggleFavorite = async (id) => {
  if (!userId) return;

  setFavorites(prev =>
    prev.includes(id)
      ? prev.filter(f => f !== id)
      : [...prev, id]
  );

  try {
    const response = await fetch('http://192.168.x.x:3000/toggle-favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: Number(userId),
        characterId: id.toString()
      })
    });

    await loadFavorites(userId);

    

  } catch (err) {
    console.log(err);
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
      <View>
        <Text style={styles.headerTitle}>Favorite Characters</Text>
      </View>
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
      <TouchableOpacity onPress={() => {
        AsyncStorage.clear();
        router.replace('/');
      }} style={{ alignSelf: 'center', marginVertical: 20 }}>
        <Text>Log Out</Text>
      </TouchableOpacity>
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
    margin: 6,
    alignSelf: 'center',
    flexDirection: 'row',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imageAnimeCard: {
    margin: 5,
    marginRight: 10,
    height: 120,
    width: 90,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  infoAnimeCard: {
    flex: 1,
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