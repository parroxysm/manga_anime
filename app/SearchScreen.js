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
  TextInput,
  TouchableOpacity,
  View,
  Keyboard
} from 'react-native';

export default function SearchScreen() {
  const router = useRouter();
  
  const [userId, setUserId] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState('characters');
  const [results, setResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); 

  useEffect(() => {
    const init = async () => {
      const uid = await getUserId();
      if (uid) await loadFavorites(uid);
    };
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) loadFavorites(userId);
    }, [userId])
  );

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    Keyboard.dismiss();
    setLoading(true);
    setHasSearched(true);

    try {

      const endpoint = viewType === 'characters'
        ? `https://api.jikan.moe/v4/characters?q=${searchQuery}&limit=20`
        : `https://api.jikan.moe/v4/manga?q=${searchQuery}&limit=20`;

      const response = await fetch(endpoint);
      const json = await response.json();

      const mappedData = (Array.isArray(json.data) ? json.data : []).map((item) => ({
        id: viewType === 'manga' ? `manga_${item.mal_id}` : item.mal_id.toString(),
        name: item.name || item.title || 'Unknown',
        image: item.images?.jpg?.image_url,
        about: (item.about || item.synopsis || 'No description available.').trim(),
        score: item.score || null
      }));

      setResults(mappedData);
    } catch (error) {
      console.error("Eroare la căutare API:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id) => {
    if (!userId) return;
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    try {
      await fetch('http://192.168.1.133:3000/toggle-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, characterId: id })
      });
    } catch (err) { console.log(err); }
  };

  return (
    <View style={styles.background}>
      
      {/* Zona de Căutare (Search Bar & Toggle) */}
      <View style={styles.searchContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${viewType}...`}
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch} 
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={24} color="#1E1E1E" />
          </TouchableOpacity>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, viewType === 'characters' && styles.toggleButtonActive]}
            onPress={() => { setViewType('characters'); setResults([]); setHasSearched(false); }}
          >
            <Text style={[styles.toggleText, viewType === 'characters' && styles.toggleTextActive]}>Characters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toggleButton, viewType === 'manga' && styles.toggleButtonActive]}
            onPress={() => { setViewType('manga'); setResults([]); setHasSearched(false); }}
          >
            <Text style={[styles.toggleText, viewType === 'manga' && styles.toggleTextActive]}>Manga</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centeredView}>
          <ActivityIndicator size="large" color="gold" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 10 }}
          ListEmptyComponent={
            hasSearched && !loading ? (
              <Text style={styles.emptyText}>No results found for "{searchQuery}".</Text>
            ) : null
          }
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
                {item.score && <Text style={{color: 'gold', fontSize: 12, marginBottom: 4}}>⭐ {item.score}</Text>}
                <Text style={styles.informatiiAnimeCard} numberOfLines={3}>{item.about}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#1E1E1E' },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  searchContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    height: 45,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: 'gold',
    height: 45,
    width: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  

  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    marginHorizontal: 5,
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: 'gold',
  },
  toggleText: {
    color: '#888',
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: 'gold',
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
  imageAnimeCard: { width: 90, height: 120, borderRadius: 8, backgroundColor: '#333' },
  infoAnimeCard: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  nameAndFavoriteContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titluAnimeCard: { flex: 1, fontSize: 18, fontWeight: 'bold', color: 'gold', marginBottom: 5 },
  informatiiAnimeCard: { fontSize: 13, lineHeight: 18, color: '#bbb' },
  emptyText: { color: 'gray', textAlign: 'center', marginTop: 50, fontSize: 16 },
});