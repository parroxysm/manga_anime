import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import IP from "../var/IP";
import { LIGHT, DARK } from "../var/Culori";

export default function ProgressScreen() {
  const [trackedItems, setTrackedItems] = useState([]);
  const [userId, setUserId] = useState(null);
  const [theme, setTheme] = useState(LIGHT);
  const router = useRouter();

  const loadTrackedItems = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      if (storedUserId) {
        setUserId(storedUserId);
        const res = await fetch(`${IP}/progress?userId=${storedUserId}`);
        const data = await res.json();
        if (data.progress) setTrackedItems(data.progress);
      }
    } catch (error) {}
  };

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("isDarkTheme").then((val) =>
        setTheme(val === "true" ? DARK : LIGHT),
      );
      loadTrackedItems();
    }, []),
  );

  const updateProgress = async (itemId, increment) => {
    const item = trackedItems.find((i) => i.itemId === itemId);
    if (!item) return;
    let newCurrent = item.current + increment;
    if (newCurrent < 0) newCurrent = 0;
    if (item.total && newCurrent > item.total) newCurrent = item.total;

    setTrackedItems((prev) =>
      prev.map((i) =>
        i.itemId === itemId ? { ...i, current: newCurrent } : i,
      ),
    );
    try {
      await fetch(`${IP}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(userId),
          itemId,
          current: newCurrent,
        }),
      });
    } catch (e) {}
  };

  const removeItem = (itemId, title) => {
    Alert.alert(
      "Delete",
      `Ești sigur că vrei să ștergi progresul pentru ${title}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setTrackedItems((prev) => prev.filter((i) => i.itemId !== itemId));
            await fetch(`${IP}/progress`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: Number(userId), itemId }),
            });
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.background, { backgroundColor: theme.fundal }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.pageTitle, { color: theme.accent }]}>
          My Progress
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push("/SettingsScreen")}
        >
          <Ionicons name="settings-outline" size={26} color={theme.accent} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={trackedItems}
        keyExtractor={(item) => item.itemId}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.textSecundar }]}>
            No progress tracked yet.
          </Text>
        }
        renderItem={({ item }) => {
          const progressPercent = item.total
            ? Math.min((item.current / item.total) * 100, 100)
            : 0;
          return (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.bordura },
              ]}
            >
              <Image
                source={{ uri: item.image }}
                style={[styles.image, { borderColor: theme.bordura }]}
              />
              <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                  <Text
                    style={[styles.title, { color: theme.accent }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeItem(item.itemId, item.title)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={theme.danger}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.subtitle, { color: theme.textSecundar }]}>
                  {item.type === "anime" ? "Episodes" : "Chapters"}:{" "}
                  <Text style={{ color: theme.text }}>{item.current}</Text> /{" "}
                  {item.total || "?"}
                </Text>
                <View
                  style={[
                    styles.progressBarBackground,
                    { backgroundColor: theme.bordura },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progressPercent}%`,
                        backgroundColor: theme.accent,
                      },
                    ]}
                  />
                </View>
                <View style={styles.controlsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.bordura,
                      },
                    ]}
                    onPress={() => updateProgress(item.itemId, -1)}
                    disabled={item.current === 0}
                  >
                    <Ionicons
                      name="remove"
                      size={24}
                      color={
                        item.current === 0 ? theme.tabInactiv : theme.accent
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.bordura,
                      },
                    ]}
                    onPress={() => updateProgress(item.itemId, 1)}
                    disabled={item.total && item.current >= item.total}
                  >
                    <Ionicons
                      name="add"
                      size={24}
                      color={
                        item.total && item.current >= item.total
                          ? theme.tabInactiv
                          : theme.accent
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, paddingTop: StatusBar.currentHeight || 40 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    paddingHorizontal: 15,
    position: "relative",
    height: 40,
  },
  pageTitle: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
  settingsButton: { position: "absolute", right: 15 },
  card: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 10,
  },
  image: { width: 80, height: 110, borderRadius: 8, borderWidth: 1 },
  infoContainer: { flex: 1, marginLeft: 12, justifyContent: "space-between" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { flex: 1, fontSize: 16, fontWeight: "bold", marginRight: 10 },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 8 },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: { height: "100%", borderRadius: 4 },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
  },
  controlButton: {
    width: 40,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    paddingHorizontal: 20,
  },
});
