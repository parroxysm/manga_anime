import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function FavoritesScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const [userId, setUserId] = useState(0);
  const [viewType, setViewType] = useState('characters'); 
  const [allFavorites, setAllFavorites] = useState([]); 
  const [filteredItems, setFilteredItems] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: viewType === 'characters' ? 'Fav Characters' : 'Fav Manga',
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => setViewType(prev => prev === 'characters' ? 'manga' : 'characters')}
          style={styles.switchButton}
        >
          <Text numberOfLines={1} style={styles.switchButtonText}>
            {viewType === 'characters' ? 'Manga' : 'Chars'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, viewType]);

  const getUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const parsed = storedUserId ? Number(storedUserId) : null;
      setUserId(parsed);
      return parsed;
    } catch (error) { console.log(error); }
  };

  const loadFavorites = async (uid) => {
    try {
      setLoading(true);
      const res = await fetch(`http://192.168.1.133:3000/favorites?userId=${uid}`);
      const data = await res.json();
      
      const favIds = data.favorites.map(f => f.characterId.toString());
      await fetchAllDetails(favIds);
    } catch (e) {
      console.log("Eroare la incarcarea favoritelor din DB:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDetails = async (favIds) => {
    try {
      const results = [];


      for (const rawId of favIds) {
        const isManga = rawId.startsWith('manga_');
        const idOnly = rawId.replace('manga_', '').replace('char_', '');
        const url = isManga 
          ? `https://api.jikan.moe/v4/manga/${idOnly}` 
          : `https://api.jikan.moe/v4/characters/${idOnly}`;

        try {
          const res = await fetch(url);
          

          if (res.status === 429) {
            console.log("Jikan API Rate Limit lovit! Asteptam 1 secunda...");
            await delay(1000); 
            continue; 
          }

          const json = await res.json();
          const item = json.data;

          if (item) {
            results.push({
              id: rawId,
              name: item.name || item.title || 'Unknown',
              image: item.images?.jpg?.image_url,
              about: (item.about || item.synopsis || 'No description available.').trim(),
            });
          }
          
          await delay(350); 

        } catch (fetchError) {
          console.log(`Eroare fetch pt ${rawId}:`, fetchError);
        }
      }

      setAllFavorites(results);
    } catch (error) { 
      console.log("Eroare majora detalii:", error); 
    }
  };

  const toggleFavorite = async (id) => {
    setAllFavorites(prev => prev.filter(item => item.id !== id));
    try {
      await fetch('http://192.168.1.133:3000/toggle-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, characterId: id })
      });
    } catch (err) { console.log(err); }
  };

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

  useEffect(() => {
    const filtered = allFavorites.filter(item => {
      if (viewType === 'manga') return item.id.startsWith('manga_');
      return !item.id.startsWith('manga_');
    });
    setFilteredItems(filtered);
  }, [viewType, allFavorites]);

  return (
    <View style={styles.background}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 10 }}
        
        refreshing={loading}
        onRefresh={() => loadFavorites(userId)} 

        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>No favorite {viewType} found.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.itemsCard}
            onPress={() => router.push({ pathname: '/DetailsScreen', params: item })}
          >
            <Image source={{ uri: item.image }} style={styles.imageAnimeCard} />
            <View style={styles.infoAnimeCard}>
              <View style={styles.nameAndFavoriteContainer}>
                <Text style={styles.titluAnimeCard} numberOfLines={1}>{item.name}</Text>
                <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                  <Ionicons name="heart" size={28} color="gold" />
                </TouchableOpacity>
              </View>
              <Text style={styles.informatiiAnimeCard} numberOfLines={3}>{item.about}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },

  backgroundCentered: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
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

  informatiiAnimeCard: {
    fontSize: 13,
    lineHeight: 18,
    color: '#bbb',
  },


  emptyText: {
    color: 'gray',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
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