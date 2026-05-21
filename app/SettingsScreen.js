import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  TextInput,
  FlatList,
  Modal,
} from "react-native";
import IP from "../var/IP";
import { LIGHT, DARK } from "../var/Culori";

export default function SettingsScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [theme, setTheme] = useState(LIGHT);
  const [stats, setStats] = useState({
    likedCharacters: 0,
    likedManga: 0,
    likedAnime: 0,
    inProgress: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const storedUserId = await AsyncStorage.getItem("userId");
      const storedUsername = await AsyncStorage.getItem("username");
      const themePref = await AsyncStorage.getItem("isDarkTheme");
      const uid = storedUserId ? Number(storedUserId) : null;
      if (!uid) {
        router.replace("/logInScreen");
        return;
      }
      setUserId(uid);
      if (storedUsername) setUsername(storedUsername);
      if (themePref !== null) {
        const isDark = JSON.parse(themePref);
        setIsDarkTheme(isDark);
        setTheme(isDark ? DARK : LIGHT);
      }

      const favRes = await fetch(`${IP}/favorites?userId=${uid}`);
      const favData = await favRes.json();
      let charsCount = 0,
        mangaCount = 0,
        animeCount = 0;
      (favData.favorites || []).forEach((f) => {
        if (f.characterId.startsWith("manga_")) mangaCount++;
        else if (f.characterId.startsWith("anime_")) animeCount++;
        else charsCount++;
      });

      const progRes = await fetch(`${IP}/progress?userId=${uid}`);
      const progData = await progRes.json();
      setStats({
        likedCharacters: charsCount,
        likedManga: mangaCount,
        likedAnime: animeCount,
        inProgress: progData.progress?.length || 0,
      });

      const friendsRes = await fetch(`${IP}/friends?userId=${uid}`);
      const friendsData = await friendsRes.json();
      setFriends(friendsData.friends || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, []),
  );

  const toggleTheme = async () => {
    const newThemeState = !isDarkTheme;
    setIsDarkTheme(newThemeState);
    setTheme(newThemeState ? DARK : LIGHT);
    await AsyncStorage.setItem("isDarkTheme", JSON.stringify(newThemeState));
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("userId");
          await AsyncStorage.removeItem("username");
          router.replace("/logInScreen");
        },
      },
    ]);
  };

  const searchUsers = async () => {
    if (!searchQuery) return;
    const res = await fetch(
      `${IP}/users/search?q=${searchQuery}&userId=${userId}`,
    );
    const data = await res.json();
    setSearchResults(data.users || []);
  };

  const addFriend = async (friendId) => {
    await fetch(`${IP}/friends/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, friendId }),
    });
    Alert.alert("Success", "Friend added!");
    loadUserData();
  };

  const viewFriendDetails = async (friendId) => {
    const res = await fetch(`${IP}/users/${friendId}/details`);
    const data = await res.json();
    if (data.success) {
      setSelectedFriend(data.user);
      setModalVisible(true);
    }
  };

  if (loading)
    return (
      <View
        style={[
          styles.background,
          styles.centered,
          { backgroundColor: theme.fundal },
        ]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );

  return (
    <ScrollView
      style={[styles.background, { backgroundColor: theme.fundal }]}
      contentContainerStyle={styles.container}
    >
      <View style={styles.profileSection}>
        <Text style={[styles.usernameText, { color: theme.accent }]}>
          {username}
        </Text>
      </View>
      <View style={styles.statsContainer}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.card, borderColor: theme.bordura },
          ]}
        >
          <Ionicons name="people" size={28} color={theme.accent} />
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {stats.likedCharacters}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecundar }]}>
            Chars
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.card, borderColor: theme.bordura },
          ]}
        >
          <Ionicons name="book" size={28} color={theme.accent} />
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {stats.likedManga}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecundar }]}>
            Manga
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.card, borderColor: theme.bordura },
          ]}
        >
          <Ionicons name="tv" size={28} color={theme.accent} />
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {stats.likedAnime}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecundar }]}>
            Anime
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.card, borderColor: theme.bordura },
          ]}
        >
          <Ionicons name="trending-up" size={28} color={theme.accent} />
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {stats.inProgress}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecundar }]}>
            Progress
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textSecundar }]}>
        Community
      </Text>
      <View
        style={[
          styles.actionsContainer,
          {
            backgroundColor: theme.card,
            borderColor: theme.bordura,
            padding: 15,
            marginBottom: 20,
          },
        ]}
      >
        <View style={styles.searchRow}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderColor: theme.bordura,
              },
            ]}
            placeholder="Search users..."
            placeholderTextColor={theme.textSecundar}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={[styles.searchBtn, { backgroundColor: theme.accent }]}
            onPress={searchUsers}
          >
            <Ionicons name="search" size={20} color={theme.fundal} />
          </TouchableOpacity>
        </View>
        {searchResults.map((u) => (
          <View key={u.id} style={styles.userRow}>
            <Text style={{ color: theme.text }}>{u.username}</Text>
            {!friends.some((f) => f.id === u.id) && (
              <TouchableOpacity onPress={() => addFriend(u.id)}>
                <Ionicons name="person-add" size={20} color={theme.accent} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textSecundar, marginTop: 15 },
          ]}
        >
          Friends List
        </Text>
        {friends.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={styles.friendRow}
            onPress={() => viewFriendDetails(f.id)}
          >
            <Text style={{ color: theme.text, fontWeight: "bold" }}>
              {f.username}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.accent} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textSecundar }]}>
        Preferences
      </Text>
      <View
        style={[
          styles.actionsContainer,
          { backgroundColor: theme.card, borderColor: theme.bordura },
        ]}
      >
        <View style={[styles.actionRow, { borderBottomColor: theme.bordura }]}>
          <View style={styles.actionLeft}>
            <Ionicons
              name={isDarkTheme ? "moon" : "sunny"}
              size={22}
              color={theme.accent}
            />
            <Text style={[styles.actionText, { color: theme.text }]}>
              Dark Theme
            </Text>
          </View>
          <Switch
            value={isDarkTheme}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.bordura, true: theme.accent }}
            thumbColor={"#FFFFFF"}
          />
        </View>
        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <View style={styles.actionLeft}>
            <Ionicons name="log-out-outline" size={24} color={theme.danger} />
            <Text style={[styles.actionText, { color: theme.danger }]}>
              Log Out
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View
          style={[styles.modalContainer, { backgroundColor: theme.fundal }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {selectedFriend?.username}'s Profile
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20 }}>
            <Text style={[styles.sectionTitle, { color: theme.accent }]}>
              In Progress ({selectedFriend?.progress?.length || 0})
            </Text>
            {selectedFriend?.progress?.map((p) => (
              <View
                key={p.id}
                style={{
                  marginBottom: 10,
                  borderBottomWidth: 1,
                  borderColor: theme.bordura,
                  paddingBottom: 5,
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "bold" }}>
                  {p.title}
                </Text>
                <Text style={{ color: theme.textSecundar }}>
                  Ep/Ch: {p.current} / {p.total || "?"}
                </Text>
              </View>
            ))}
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.accent, marginTop: 20 },
              ]}
            >
              Favorites ({selectedFriend?.favorites?.length || 0})
            </Text>
            {selectedFriend?.favorites?.map((f) => (
              <Text key={f.id} style={{ color: theme.text, marginBottom: 5 }}>
                {f.characterId.replace("_", ": ")}
              </Text>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  centered: { justifyContent: "center", alignItems: "center" },
  profileSection: { alignItems: "flex-start", marginTop: 20, marginBottom: 25 },
  usernameText: { fontSize: 28, fontWeight: "bold" },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 2,
    borderRadius: 12,
    marginHorizontal: 3,
    alignItems: "center",
    borderWidth: 1,
    elevation: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: { fontSize: 11, textAlign: "center" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 5,
  },
  actionsContainer: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  logoutButton: { borderBottomWidth: 0 },
  actionLeft: { flexDirection: "row", alignItems: "center" },
  actionText: { fontSize: 16, marginLeft: 15, fontWeight: "500" },
  searchRow: { flexDirection: "row", marginBottom: 10 },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginLeft: 10,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  friendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  modalContainer: { flex: 1, paddingTop: 50 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  modalTitle: { fontSize: 22, fontWeight: "bold" },
});
