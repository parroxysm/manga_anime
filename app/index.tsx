import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { 
  TouchableOpacity,
  View, 
  StyleSheet, 
  Text, 
  Image, 
  FlatList, 
  SafeAreaView, 
  ActivityIndicator 
} from 'react-native';

interface Character {
  mal_id: number;
  name: string;
  about: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
}

const AnimeListingScreen = () => {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInfo();
  }, []);

  const getInfo = async () => {
    try {
      setLoading(true);
      const randomPage = Math.floor(Math.random() * 50) + 1;
      const URL = `https://api.jikan.moe/v4/top/characters?page=${randomPage}`;

      const response = await fetch(URL);
      const json = await response.json();
      
      const shuffled = json.data.sort(() => 0.5 - Math.random());
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
    <SafeAreaView style={styles.background}>
      <Text style={styles.headerTitle}>Anime Characters</Text>
      
      <FlatList 
        data={characters} 
        keyExtractor={(item) => item.mal_id.toString()}
        onRefresh={() => getInfo()} 
        refreshing={loading}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.itemsCard} 
            onPress={() => {
              router.push({
                pathname: './DetailsScreen',
                params: { 
                  name: item.name, 
                  image: item.images.jpg.image_url, 
                  about: item.about 
                }
              });
            }}
          >
            <Image 
              source={{ uri: item.images.jpg.image_url }} 
              style={styles.imagine} 
            />
            <View style={styles.infos}>
              <Text style={styles.titlu}>{item.name}</Text>
              <Text style={styles.informatii} numberOfLines={3}>
                {item.about || "No description available."}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default AnimeListingScreen;

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
    width: '94%',
    alignSelf: 'center',
    flexDirection: 'row',
    marginBottom: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imagine: {
    height: 120,
    width: 90,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  infos: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  titlu: {
    color: 'gold',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5
  },
  informatii: {
    color: '#bbb',
    fontSize: 13,
    lineHeight: 18,
  },
});