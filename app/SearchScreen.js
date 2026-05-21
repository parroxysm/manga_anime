import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, Stack } from 'expo-router';
import { useCallback, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard, StatusBar } from 'react-native';
import IP from '../var/IP';
import { LIGHT, DARK } from '../var/Culori';

export default function SearchScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState('anime');
  const [results, setResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); 
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
      if (uid) await loadFavorites(uid);
    };
    init();
  }, []);

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setHasSearched(true);

    try {
      let endpoint = `https://api.jikan.moe/v4/${viewType}?q=${searchQuery}&limit=25`;
      const response = await fetch(endpoint);
      const json = await response.json();

      const mappedData = (Array.isArray(json.data) ? json.data : []).map((item) => {
        let totalVal = null;
        if (viewType === 'manga') totalVal = item.chapters;
        else if (viewType === 'anime') totalVal = item.episodes; 
        let idPrefix = viewType === 'manga' ? 'manga_' : viewType === 'anime' ? 'anime_' : 'char_';

        return {
          actualId: item.mal_id,
          id: `${idPrefix}${item.mal_id}`,
          name: item.name || item.title || 'Unknown',
          image: item.images?.jpg?.image_url,
          about: (item.about || item.synopsis || 'No description available.').trim(),
          score: item.score || null,
          totalItems: totalVal,
          kind: viewType 
        };
      });

      setResults(mappedData);
    } catch (error) {
      showToast("Error fetching results");
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
        body: JSON.stringify({ userId, characterId: id })
      });
      showToast(isAdding ? "Added to favorites" : "Removed from favorites");
    } catch (err) {
      showToast("Error updating favorites");
    }
  };

  return (
    <View style={[styles.background, { backgroundColor: theme.fundal }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.searchContainer, { backgroundColor: theme.fundal, borderBottomColor: theme.bordura }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.bordura }]}
            placeholder={`Search ${viewType}...`}
            placeholderTextColor={theme.textSecundar}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch} 
          />
          <TouchableOpacity style={[styles.searchButton, { backgroundColor: theme.accent }]} onPress={handleSearch}>
            <Ionicons name="search" size={24} color={theme.fundal} />
          </TouchableOpacity>
        </View>

        <View style={[styles.topTabsContainer, { backgroundColor: theme.card, borderColor: theme.bordura }]}>
          {['anime', 'manga', 'characters'].map((type) => (
            <TouchableOpacity 
              key={type}
              style={[styles.tabButton, viewType === type && { backgroundColor: theme.accent }]}
              onPress={() => { setViewType(type); setResults([]); setHasSearched(false); }}
            >
              <Text style={[styles.tabText, { color: viewType === type ? theme.fundal : theme.textSecundar }]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.centeredView}><ActivityIndicator size="large" color={theme.accent} /></View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
          ListEmptyComponent={
            hasSearched && !loading ? <Text style={[styles.emptyText, { color: theme.textSecundar }]}>No results found.</Text> : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.itemsCard, { backgroundColor: theme.card, borderColor: theme.bordura }]}
              onPress={() => router.push({ pathname: '/DetailsScreen', params: item })}
            >
              <Image source={{ uri: item.image }} style={[styles.imageAnimeCard, { borderColor: theme.bordura }]} />
              <View style={styles.infoAnimeCard}>
                <View style={styles.nameAndFavoriteContainer}>
                  <Text style={[styles.titluAnimeCard, { color: theme.accent }]} numberOfLines={1}>{item.name}</Text>
                  <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                    <Ionicons name={favorites.includes(item.id) ? "heart" : "heart-outline"} size={28} color={favorites.includes(item.id) ? theme.danger : theme.bordura} />
                  </TouchableOpacity>
                </View>
                {item.score && <Text style={[styles.scoreText, { color: theme.accent }]}>⭐ {item.score}</Text>}
                <Text style={[styles.informatiiAnimeCard, { color: theme.textSecundar }]} numberOfLines={3}>{item.about}</Text>
              </View>
            </TouchableOpacity>
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
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  searchButton: {
    marginLeft: 10,
    height: 45,
    width: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTabsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
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
    marginBottom: 4,
  },
  informatiiAnimeCard: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
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
});