import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import FavoritesScreen from './favoriteScreen';
import SearchScreen from './SearchScreen';
import ProgressScreen from './ProgressScreen';
import IP from '../var/IP';
import { LIGHT, DARK } from '../var/Culori';

const Tab = createBottomTabNavigator();

const AnimatedCard = ({ item, theme, favorites, toggleFavorite, router }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        style={[styles.itemsCard, { backgroundColor: theme.card, borderColor: theme.bordura }]} 
        onPress={() => router.push({ pathname: '/DetailsScreen', params: item })}
      >
        <Image source={{ uri: item.image }} style={[styles.imageAnimeCard, { borderColor: theme.bordura }]} />
        <View style={styles.infoAnimeCard}>
          <View style={styles.nameAndFavoriteContainer}>
            <Text style={[styles.titluAnimeCard, { color: theme.accent }]} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
              <Ionicons 
                name={favorites.includes(item.id) ? "heart" : "heart-outline"} 
                size={28} 
                color={favorites.includes(item.id) ? theme.danger : theme.bordura} 
              />
            </TouchableOpacity>
          </View>
          {item.score && <Text style={[styles.scoreText, { color: theme.accent }]}>⭐ {item.score}</Text>}
          <Text style={[styles.informatiiAnimeCard, { color: theme.textSecundar }]} numberOfLines={3}>{item.about}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const HomePage = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const [viewType, setViewType] = useState('anime'); 
  const [userId, setUserId] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [theme, setTheme] = useState(LIGHT);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeout = useRef(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('isDarkTheme').then(val => setTheme(val === 'true' ? DARK : LIGHT));
      if (userId) loadFavorites(userId);
    }, [userId])
  );

  useEffect(() => {
    const init = async () => {
      const uid = await getUserId();
      if (uid) {
        await loadFavorites(uid);
        await getInfo('anime');
      }
    };
    init();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Explore',
      headerStyle: { backgroundColor: theme.fundal, elevation: 0, shadowOpacity: 0 },
      headerTintColor: theme.text,
      headerRight: () => null,
    });
  }, [navigation, theme]);

  useEffect(() => { getInfo(viewType); }, [viewType]);

  const showToast = (message) => {
    setToastMessage(message);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMessage(''), 3000);
  };

  const getUserId = async () => { 
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const parsed = storedUserId ? Number(storedUserId) : null;
      if (!parsed) router.replace('/logInScreen');
      setUserId(parsed);
      return parsed;
    } catch (error) {}
  };

  const loadFavorites = async (uid) => {
    try {
      const res = await fetch(`${IP}/favorites?userId=${uid}`);
      const data = await res.json();
      setFavorites(data.favorites.map(f => f.characterId.toString()));
    } catch (e) {}
  };

  const getInfo = async (type) => {
    try {
      setLoading(true);
      const randomPage = Math.floor(Math.random() * 15) + 1;
      let URL = `https://api.jikan.moe/v4/top/${type}?page=${randomPage}`;

      const response = await fetch(URL);
      const json = await response.json();
      
      if (json.data) {
        const mappedData = json.data.map((item) => ({
          actualId: item.mal_id,
          id: type === 'manga' ? `manga_${item.mal_id}` : type === 'anime' ? `anime_${item.mal_id}` : `char_${item.mal_id}`,
          name: item.name || item.title || 'Unknown', 
          image: item.images?.jpg?.image_url,
          about: (item.about || item.synopsis || 'No description available.').trim(),
          score: item.score || null,
          total: type === 'manga' ? item.chapters : type === 'anime' ? item.episodes : null,
          type: type
        }));

        const uniqueItems = mappedData.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setItems(uniqueItems);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id) => {
    if (!userId) return;
    const isAdding = !favorites.includes(id);
    setFavorites(prev => isAdding ? [...prev, id] : prev.filter(f => f !== id));
    
    try {
      await fetch(`${IP}/toggle-favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: Number(userId), characterId: id })
      });
      showToast(isAdding ? "Added to favorites" : "Removed from favorites");
    } catch (err) {
      showToast("Error updating favorites");
    }
  };

  return (
    <View style={[styles.background, { backgroundColor: theme.fundal }]}>
      <View style={styles.topTabsContainer}>
        {['anime', 'manga', 'characters'].map((t) => (
          <TouchableOpacity 
            key={t}
            style={[styles.tabButton, { borderColor: theme.bordura }, viewType === t && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => setViewType(t)}
          >
            <Text style={[styles.tabText, { color: viewType === t ? theme.fundal : theme.textSecundar }]}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList 
          data={items} 
          keyExtractor={(item) => item.id}
          onRefresh={() => getInfo(viewType)} 
          refreshing={loading}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <AnimatedCard item={item} theme={theme} favorites={favorites} toggleFavorite={toggleFavorite} router={router} />
          )}
        />
      )}

      {toastMessage !== '' && (
        <View style={[styles.toastContainer, { backgroundColor: theme.accent }]}>
          <Text style={[styles.toastText, { color: theme.fundal }]}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
};

export default function Main() {
  const [theme, setTheme] = useState(LIGHT);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('isDarkTheme').then(val => setTheme(val === 'true' ? DARK : LIGHT));
    }, [])
  );

  return (
    <>
      <Tab.Navigator screenOptions={({ route }) => ({ 
        headerShown: true, 
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.bordura },
        headerStyle: { backgroundColor: theme.fundal, elevation: 0, shadowOpacity: 0 },
        headerTintColor: theme.text,
        headerTitleAlign: 'center',
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          if (route.name === 'Search') iconName = 'search';
          else if (route.name === 'Favorites') iconName = 'heart';
          else if (route.name === 'Progress') iconName = 'list';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.tabInactiv,
      })}>
        <Tab.Screen name="Home" component={HomePage} />
        <Tab.Screen name="Search" component={SearchScreen} options={{headerShown: false}} />
        <Tab.Screen name="Favorites" component={FavoritesScreen} />
        <Tab.Screen name="Progress" component={ProgressScreen} options={{headerShown: false}}/>
      </Tab.Navigator>
      
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.accent }]} 
        onPress={() => router.push('/AiChatScreen')}
      >
        <Ionicons name="chatbubbles" size={28} color={theme.fundal} />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 15,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  itemsCard: {
    flexDirection: 'row',
    padding: 10,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  imageAnimeCard: {
    width: 90,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
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
    marginBottom: 5,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  informatiiAnimeCard: {
    fontSize: 13,
    lineHeight: 18,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 5,
    zIndex: 1000,
  },
  toastText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
});