import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import IP from "../var/IP";
import { LIGHT, DARK } from "../var/Culori";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function FavoritesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [userId, setUserId] = useState(0);
  const [viewType, setViewType] = useState("anime");
  const [allFavorites, setAllFavorites] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(LIGHT);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("isDarkTheme").then((val) =>
        setTheme(val === "true" ? DARK : LIGHT),
      );
      if (userId) loadFavorites(userId);
    }, [userId]),
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerStyle: {
        backgroundColor: theme.fundal,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerRight: () => (
        <View
          style={[
            styles.segmentedControl,
            { borderColor: theme.bordura, backgroundColor: theme.card },
          ]}
        >
          {["anime", "manga", "characters"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.segmentButton,
                viewType === type && { backgroundColor: theme.accent },
              ]}
              onPress={() => setViewType(type)}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      viewType === type ? theme.fundal : theme.textSecundar,
                  },
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
    });
  }, [navigation, viewType, theme]);

  const getUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      const parsed = storedUserId ? Number(storedUserId) : null;
      setUserId(parsed);
      return parsed;
    } catch (error) {}
  };

  const loadFavorites = async (uid) => {
    if (!uid) return;
    try {
      setLoading(true);
      const res = await fetch(`${IP}/favorites?userId=${uid}`);
      const data = await res.json();
      await fetchAllDetails(
        data.favorites.map((f) => f.characterId.toString()),
      );
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDetails = async (favIds) => {
    const results = [];
    for (const rawId of favIds) {
      const isManga = rawId.startsWith("manga_");
      const isAnime = rawId.startsWith("anime_");
      const idOnly = rawId
        .replace("manga_", "")
        .replace("anime_", "")
        .replace("char_", "");
      const url = isManga
        ? `https://api.jikan.moe/v4/manga/${idOnly}`
        : isAnime
          ? `https://api.jikan.moe/v4/anime/${idOnly}`
          : `https://api.jikan.moe/v4/characters/${idOnly}`;

      try {
        const res = await fetch(url);
        if (res.status === 429) {
          await delay(1000);
          continue;
        }
        const json = await res.json();
        const item = json.data;
        if (item) {
          results.push({
            actualId: item.mal_id,
            id: rawId,
            name: item.name || item.title || "Unknown",
            image: item.images?.jpg?.image_url,
            about: (
              item.about ||
              item.synopsis ||
              "No description available."
            ).trim(),
            kind: isManga ? "manga" : isAnime ? "anime" : "characters",
          });
        }
        await delay(350);
      } catch (err) {}
    }
    setAllFavorites(results);
  };

  const toggleFavorite = async (id) => {
    setAllFavorites((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`${IP}/toggle-favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, characterId: id }),
      });
    } catch (err) {}
  };

  useEffect(() => {
    const init = async () => {
      const uid = await getUserId();
      if (uid) await loadFavorites(uid);
    };
    init();
  }, []);

  useEffect(() => {
    setFilteredItems(allFavorites.filter((item) => item.kind === viewType));
  }, [viewType, allFavorites]);

  return (
    <View style={[styles.background, { backgroundColor: theme.fundal }]}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 10 }}
        refreshing={loading}
        onRefresh={() => loadFavorites(userId)}
        ListEmptyComponent={
          !loading && (
            <Text style={[styles.emptyText, { color: theme.textSecundar }]}>
              No favorite {viewType} found.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.itemsCard,
              { backgroundColor: theme.card, borderColor: theme.bordura },
            ]}
            onPress={() =>
              router.push({ pathname: "/DetailsScreen", params: item })
            }
          >
            <Image
              source={{ uri: item.image }}
              style={[styles.imageAnimeCard, { borderColor: theme.bordura }]}
            />
            <View style={styles.infoAnimeCard}>
              <View style={styles.nameAndFavoriteContainer}>
                <Text
                  style={[styles.titluAnimeCard, { color: theme.accent }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <TouchableOpacity
                  onPress={() => toggleFavorite(item.id)}
                  disabled={loading}
                  style={{ opacity: loading ? 0.5 : 1 }}
                >
                  <Ionicons name="heart" size={28} color={theme.danger} />
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.informatiiAnimeCard,
                  { color: theme.textSecundar },
                ]}
                numberOfLines={3}
              >
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
  background: { flex: 1 },
  itemsCard: {
    flexDirection: "row",
    padding: 10,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  imageAnimeCard: { width: 90, height: 120, borderRadius: 8, borderWidth: 1 },
  infoAnimeCard: { flex: 1, marginLeft: 12, justifyContent: "center" },
  nameAndFavoriteContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titluAnimeCard: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  informatiiAnimeCard: { fontSize: 13, lineHeight: 18 },
  emptyText: { textAlign: "center", marginTop: 50, fontSize: 16 },
  segmentedControl: {
    flexDirection: "row",
    marginRight: 15,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  segmentButton: { paddingVertical: 6, paddingHorizontal: 12 },
  segmentText: { fontSize: 12, fontWeight: "bold" },
});
