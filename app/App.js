import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import FavoritesScreen from './favoriteScreen';
import MangaScreen from './mangaScreen.js';
import SearchScreen from './SearchScreen';

const Tab = createBottomTabNavigator();

const HomePage = () => {
  const router = useRouter();
  const navigation = useNavigation();
  
  const [viewType, setViewType] = useState('characters'); 
  const [userId, setUserId] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const init = async () => {
      const uid = await getUserId();
      if (uid) {
        await loadFavorites(uid);
        await getInfo('characters', uid);
      }
    };
    init();
  }, []);


  useFocusEffect(
    useCallback(() => {
      if (userId) loadFavorites(userId);
    }, [userId])
  );


  useEffect(() => {
    navigation.setOptions({
      headerTitle: viewType === 'characters' ? 'Top Characters' : 'Top Manga',
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => setViewType(prev => prev === 'characters' ? 'manga' : 'characters')}
          style={styles.switchButton}
        >
          <Text style={styles.switchButtonText}>
            {viewType === 'characters' ? 'Manga' : 'Chars'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, viewType]);


  useEffect(() => {
    getInfo(viewType);
  }, [viewType]);

  const getUserId = async () => { 
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const parsed = storedUserId ? Number(storedUserId) : null;
      if (!parsed) router.replace('/logInScreen');
      setUserId(parsed);
      return parsed;
    } catch (error) { console.log(error); }
  };

  const loadFavorites = async (uid) => {
    try {
      const res = await fetch(`http://192.168.1.133:3000/favorites?userId=${uid}`);
      const data = await res.json();
      const favIds = data.favorites.map(f => f.characterId.toString());
      setFavorites(favIds);
    } catch (e) { console.log(e); }
  };

  const getInfo = async (type) => {
  try {
    setLoading(true);
    const randomPage = Math.floor(Math.random() * 20) + 1;
    const URL = type === 'characters' 
      ? `https://api.jikan.moe/v4/top/characters?page=${randomPage}`
      : `https://api.jikan.moe/v4/top/manga?page=${randomPage}`;

    const response = await fetch(URL);
    const json = await response.json();
    
    if (json.data) {
      const mappedData = json.data.map((item) => ({
        id: type === 'manga' ? `manga_${item.mal_id}` : `char_${item.mal_id}`,
        name: item.name || item.title || 'Unknown', 
        image: item.images?.jpg?.image_url,
        about: (item.about || item.synopsis || 'No description available.').trim(),
        score: item.score || null
      }));

      const uniqueItems = mappedData.filter((value, index, self) =>
        index === self.findIndex((t) => t.id === value.id)
      );

      setItems(uniqueItems);
    }
  } catch (error) {
    console.error("Eroare la API:", error);
  } finally {
    setLoading(false);
  }
};

  const toggleFavorite = async (id) => {
  if (!userId) return;

  setFavorites(prev => 
    prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
  );

  try {
    await fetch('http://192.168.1.133:3000/toggle-favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: Number(userId), 
        characterId: id
      })
    });
  } catch (err) {
    console.log("Eroare la salvare:", err);
  }
};

  if (loading) {
    return (
      <View style={[styles.background, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="gold" />
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <FlatList 
        data={items} 
        keyExtractor={(item) => item.id}
        onRefresh={() => getInfo(viewType)} 
        refreshing={loading}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.itemsCard} 
            onPress={() => router.push({ pathname: '/DetailsScreen', params: { name: item.name, image: item.image, about: item.about } })}
          >
            <Image source={{ uri: item.image }} style={styles.imageAnimeCard} />
            <View style={styles.infoAnimeCard}>
              <View style={styles.nameAndFavoriteContainer}>
                <Text style={styles.titluAnimeCard} numberOfLines={1}>{item.name}</Text>
                <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                  <Ionicons 
                    name={favorites.includes(item.id) ? "heart" : "heart-outline"} 
                    size={28} 
                    color={favorites.includes(item.id) ? "gold" : "#ccc"} 
                  />
                </TouchableOpacity>
              </View>
              {item.score && <Text style={styles.scoreText}>⭐ {item.score}</Text>}
              <Text style={styles.informatiiAnimeCard} numberOfLines={3}>{item.about}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default function Main(){
  return(
    <Tab.Navigator screenOptions={{ 
      headerShown: true, 
      tabBarStyle: { backgroundColor: '#1E1E1E', borderTopColor: '#333' },
      headerStyle: styles.AnimePageHeaderStyle,
      headerTintColor: 'white',
      headerTitleAlign: 'center'
    }}>
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },


  itemsCard: {
    flexDirection: 'row',
    padding: 10,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },


  imageAnimeCard: {
    width: 90,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#333',
  },

  
  infoAnimeCard: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },

  
  nameAndFavoriteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  titluAnimeCard: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'gold',
    marginBottom: 5,
  },

  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'gold',
    marginBottom: 4,
  },

  informatiiAnimeCard: {
    fontSize: 13,
    lineHeight: 18,
    color: '#bbb',
  },


  AnimePageHeaderStyle: {
    backgroundColor: '#1E1E1E',
    elevation: 0,
    shadowOpacity: 0,
  },

  switchButton: {
    marginRight: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'gold',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },

  switchButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'gold',
  },
});