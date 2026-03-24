import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { use, useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
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

const Tab = createBottomTabNavigator();

const HomePage = () => {
  const router = useRouter();
  const [userId, setUserId] = useState(0);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const init = async () => {
    await getUserId();
    await getInfo();
    };

    init();
    console.log("USERID:", userId);
  }, []);

  const navigation = useNavigation();
  useEffect(() => {
    navigation.addListener('tabPress', () => {
      getInfo();
    });
  }, [navigation]);

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

    const data = await response.json();
    console.log("SERVER:", data);

    

  } catch (err) {
    console.log(err);
  }
};


  const getInfo = async () => {
    try {
      setLoading(true);
      const randomPage = Math.floor(Math.random() * 50) + 1;
      const URL = `https://api.jikan.moe/v4/top/characters?page=${randomPage}`;

      const response = await fetch(URL);
      const json = await response.json();
      
      const mappedCharacters = (Array.isArray(json.data) ? json.data : []).map((character) => ({
        id: character.mal_id.toString(),
        name: character.name || 'Unknown',
        image: character.images?.jpg?.image_url || 'https://placehold.co/300x400?text=No+Image',
        about: character.about?.trim() || 'No description available.',
      }));

      const shuffled = mappedCharacters.sort(() => 0.5 - Math.random());
      setCharacters(shuffled);
    } catch (error) {
      console.error("Eroare la API:", error);
    } finally {
      setLoading(false);
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
        data={characters} 
        keyExtractor={(item) => item.id}
        onRefresh={() => getInfo()} 
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
                <TouchableOpacity onPress={() => {toggleFavorite(item.id)}}>
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

export default function Main(){
  return(
  <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#1E1E1E', borderColor: '#1E1E1E' } }}>
    <Tab.Screen 
      name="Home" 
      options={{headerShown: true, headerTitle: 'Anime Characters', headerTitleAlign: 'center', headerTintColor: 'white', headerStyle: styles.AnimePageHeaderStyle}}
      component={HomePage} />
    <Tab.Screen name="test1" component={FavoritesScreen} />
    <Tab.Screen name="test2" component={FavoritesScreen} />
    <Tab.Screen name="Profile" component={FavoritesScreen} />
  </Tab.Navigator>
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
  }
});