import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FavoritesScreen from "./favoriteScreen";
import SearchScreen from "./SearchScreen";
import ProgressScreen from "./ProgressScreen";
import IP from "../var/IP";
import { LIGHT, DARK } from "../var/Culori";

const Tab = createBottomTabNavigator();

const HomePage = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const [viewType, setViewType] = useState("anime");
  const [userId, setUserId] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
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
    const init = async () => {
      const uid = await getUserId();
      if (uid) {
        await loadFavorites(uid);
        await getInfo("anime");
      }
    };
    init();
  }, []);

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

  useEffect(() => {
    getInfo(viewType);
  }, [viewType]);

  const getUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      const parsed = storedUserId ? Number(storedUserId) : null;
      if (!parsed) router.replace("/logInScreen");
      setUserId(parsed);
      return parsed;
    } catch (error) {}
  };

  const loadFavorites = async (uid) => {
    try {
      const res = await fetch(`${IP}/favorites?userId=${uid}`);
      const data = await res.json();
      setFavorites(data.favorites.map((f) => f.characterId.toString()));
    } catch (e) {}
  };

  const getInfo = async (type) => {
    try {
      setLoading(true);
      const randomPage = Math.floor(Math.random() * 15) + 1;
      let URL = "";
      if (type === "characters")
        URL = `https://api.jikan.moe/v4/top/characters?page=${randomPage}`;
      else if (type === "manga")
        URL = `https://api.jikan.moe/v4/top/manga?page=${randomPage}`;
      else URL = `https://api.jikan.moe/v4/top/anime?page=${randomPage}`;

      const response = await fetch(URL);
      const json = await response.json();

      if (json.data) {
        const mappedData = json.data.map((item) => ({
          actualId: item.mal_id,
          id:
            type === "manga"
              ? `manga_${item.mal_id}`
              : type === "anime"
                ? `anime_${item.mal_id}`
                : `char_${item.mal_id}`,
          name: item.name || item.title || "Unknown",
          image: item.images?.jpg?.image_url,
          about: (
            item.about ||
            item.synopsis ||
            "No description available."
          ).trim(),
          score: item.score || null,
          totalItems:
            type === "manga"
              ? item.chapters
              : type === "anime"
                ? item.episodes
                : null,
          kind: type,
        }));

        const uniqueItems = mappedData.filter(
          (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
        );
        setItems(uniqueItems);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id) => {
    if (!userId) return;
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
    try {
      await fetch(`${IP}/toggle-favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), characterId: id }),
      });
    } catch (err) {}
  };

  if (loading) {
    return (
      <View
        style={[
          styles.background,
          { backgroundColor: theme.fundal, justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.background, { backgroundColor: theme.fundal }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => getInfo(viewType)}
        refreshing={loading}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.itemsCard,
              { backgroundColor: theme.card, borderColor: theme.bordura },
            ]}
            onPress={() =>
              router.push({
                pathname: "/DetailsScreen",
                params: {
                  actualId: item.actualId,
                  id: item.id,
                  name: item.name,
                  image: item.image,
                  about: item.about,
                  total: item.totalItems ? item.totalItems.toString() : "",
                  type: item.kind,
                },
              })
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
                <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                  <Ionicons
                    name={
                      favorites.includes(item.id) ? "heart" : "heart-outline"
                    }
                    size={28}
                    color={
                      favorites.includes(item.id) ? theme.danger : theme.bordura
                    }
                  />
                </TouchableOpacity>
              </View>
              {item.score && (
                <Text style={[styles.scoreText, { color: theme.accent }]}>
                  ⭐ {item.score}
                </Text>
              )}
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
};

export default function Main() {
  const [theme, setTheme] = useState(LIGHT);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("isDarkTheme").then((val) =>
        setTheme(val === "true" ? DARK : LIGHT),
      );
    }, []),
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.bordura,
        },
        headerStyle: {
          backgroundColor: theme.fundal,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.text,
        headerTitleAlign: "center",
        tabBarIcon: ({ color, size }) => {
          let iconName = "home";
          if (route.name === "Search") iconName = "search";
          else if (route.name === "Favorites") iconName = "heart";
          else if (route.name === "Progress") iconName = "list";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.tabInactiv,
      })}
    >
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
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
  scoreText: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  informatiiAnimeCard: { fontSize: 13, lineHeight: 18 },
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
