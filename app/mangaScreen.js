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

export default function MangaScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState(0);
  const [mangaList, setMangaList] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const getUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const parsed = storedUserId ? Number(storedUserId) : null;
      setUserId(parsed);
      return parsed;
    } catch (error) {
      console.log(error);
    }
  };

  const loadFavorites = async (uid) => {
    if (!uid) return;
    try {
      const res = await fetch(`http://192.168.1.133:3000/favorites?userId=${uid}`);
      const data = await res.json();
      const favIds = data.favorites
      .map(f => f.characterId.toString())
      .filter(id => idStartsWith('manga_'))
      .map(id => id.replace('manga_', ''));
      setFavorites(favIds);
    } catch (e) {
      console.log(e);
    }
  };

  const fetchManga = async () => {
    try {
      setLoading(true);
      const randomPage = Math.floor(Math.random() * 20) + 1;
      const response = await fetch(`https://api.jikan.moe/v4/top/manga?page=${randomPage}`);
      const json = await response.json();

      const mappedManga = (Array.isArray(json.data) ? json.data : []).map((manga) => ({
        id: manga.mal_id.toString(),
        name: manga.title || 'Unknown',
        image: manga.images?.jpg?.image_url,
        about: manga.synopsis?.trim() || 'No description available.',
        score: manga.score || 'N/A'
      }));

      setMangaList(mappedManga);
    } catch (error) {
      console.log(error);
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
          characterId: `manga_${id}`
        })
      });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const uid = await getUserId();
      if (uid) await loadFavorites(uid);
      await fetchManga();
    };
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) loadFavorites(userId);
    }, [userId])
  );

  if (loading) {
    return (
      <View style={styles.backgroundCentered}>
        <ActivityIndicator size="large" color="gold" />
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <FlatList
        data={mangaList}
        keyExtractor={(item) => item.id}
        onRefresh={fetchManga}
        refreshing={loading}
        contentContainerStyle={{ paddingTop: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemsCard}
            onPress={() => {
              router.push({
                pathname: '/DetailsScreen',
                params: { name: item.name, image: item.image, about: item.about }
              });
            }}
          >
            <Image source={{ uri: item.image }} style={styles.imageMangaCard} />
            <View style={styles.infoMangaCard}>
              <View style={styles.nameAndFavoriteContainer}>
                <Text style={styles.titluMangaCard} numberOfLines={1}>{item.name}</Text>
                <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                  <Ionicons 
                    name={favorites.includes(item.id) ? "heart" : "heart-outline"} 
                    size={28} 
                    color={favorites.includes(item.id) ? "gold" : "#ccc"} 
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.scoreText}>⭐ {item.score}</Text>
              <Text style={styles.informatiiMangaCard} numberOfLines={3}>
                {item.about}
              </Text>
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
    alignItems: 'center'
  },
  itemsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imageMangaCard: {
    height: 120,
    width: 90,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  infoMangaCard: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameAndFavoriteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  titluMangaCard: {
    color: 'gold',
    fontWeight: 'bold',
    fontSize: 17,
    flex: 1,
    marginRight: 5
  },
  scoreText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4
  },
  informatiiMangaCard: {
    color: '#bbb',
    fontSize: 13,
    lineHeight: 18,
  },
});