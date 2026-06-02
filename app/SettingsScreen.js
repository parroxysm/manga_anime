import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState, useRef, useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch, TextInput, FlatList, Modal, Image, SafeAreaView, Platform, StatusBar, Animated, Alert } from 'react-native';
import IP from '../var/IP';
import { LIGHT, DARK } from '../var/Culori';

export default function SettingsScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [theme, setTheme] = useState(LIGHT);
  const [stats, setStats] = useState({ likedCharacters: 0, likedManga: 0, likedAnime: 0, inProgress: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeout = useRef(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingFriend, setLoadingFriend] = useState(false);
  const [friendFavorites, setFriendFavorites] = useState([]);
  const [quizData, setQuizData] = useState(null);
  const [manualCharInput, setManualCharInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message) => {
    setToastMessage(message);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMessage(''), 3000);
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedUsername = await AsyncStorage.getItem('username');
      const themePref = await AsyncStorage.getItem('isDarkTheme');
      const storedQuiz = await AsyncStorage.getItem('quizResult');
      
      const uid = storedUserId ? Number(storedUserId) : null;
      if (!uid) { router.replace('/logInScreen'); return; }
      
      setUserId(uid);
      if (storedUsername) setUsername(storedUsername);
      if (storedQuiz) setQuizData(JSON.parse(storedQuiz));
      if (themePref !== null) {
        const isDark = JSON.parse(themePref);
        setIsDarkTheme(isDark);
        setTheme(isDark ? DARK : LIGHT);
      }
      
      const favRes = await fetch(`${IP}/favorites?userId=${uid}`);
      const favData = await favRes.json();
      let charsCount = 0, mangaCount = 0, animeCount = 0;
      (favData.favorites || []).forEach(f => {
        if (f.characterId.startsWith('manga_')) mangaCount++;
        else if (f.characterId.startsWith('anime_')) animeCount++;
        else charsCount++;
      });

      const progRes = await fetch(`${IP}/progress?userId=${uid}`);
      const progData = await progRes.json();
      setStats({ likedCharacters: charsCount, likedManga: mangaCount, likedAnime: animeCount, inProgress: progData.progress?.length || 0 });

      const friendsRes = await fetch(`${IP}/friends?userId=${uid}`);
      const friendsData = await friendsRes.json();
      setFriends(friendsData.friends || []);
    } catch (error) {
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  };

  useFocusEffect(useCallback(() => { loadUserData(); }, []));

  const toggleTheme = async () => {
    const newThemeState = !isDarkTheme;
    setIsDarkTheme(newThemeState);
    setTheme(newThemeState ? DARK : LIGHT);
    await AsyncStorage.setItem('isDarkTheme', JSON.stringify(newThemeState));
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('username');
      router.replace('/logInScreen');
    } catch (e) {}
  };

  const searchUsers = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(`${IP}/users/search?q=${searchQuery}&userId=${userId}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (e) {
      showToast("Search failed");
    }
  };

  const addFriend = async (friendId) => {
    try {
      await fetch(`${IP}/friends/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, friendId }) });
      setSearchQuery('');
      setSearchResults([]);
      showToast("Friend added");
      loadUserData();
    } catch (e) {
      showToast("Failed to add friend");
    }
  };

  const resetQuiz = async () => {
    await AsyncStorage.removeItem('quizResult');
    setQuizData(null);
  };

  const setManualCharacter = async () => {
    if(!manualCharInput.trim()) return;
    const manualData = { character: manualCharInput, anime: "Custom", reason: "Manually selected" };
    await AsyncStorage.setItem('quizResult', JSON.stringify(manualData));
    setQuizData(manualData);
    setShowManualInput(false);
    setManualCharInput('');
  };

  const fetchFriendFavoritesDetails = async (favIds) => {
    const results = [];
    for (const rawId of favIds.slice(0, 15)) { 
      const isManga = rawId.startsWith('manga_');
      const isAnime = rawId.startsWith('anime_');
      const idOnly = rawId.replace('manga_', '').replace('anime_', '').replace('char_', '');
      const type = isManga ? 'manga' : isAnime ? 'anime' : 'characters';
      const url = `https://api.jikan.moe/v4/${type}/${idOnly}`;
      
      try {
        const res = await fetch(url);
        if (res.status === 429) { await new Promise(r => setTimeout(r, 1000)); continue; }
        const json = await res.json();
        if (json.data) {
          results.push({
            id: rawId,
            name: json.data.name || json.data.title || 'Unknown',
            image: json.data.images?.jpg?.image_url,
            type: type
          });
        }
        await new Promise(r => setTimeout(r, 350));
      } catch(e) {}
    }
    return results;
  };

  const viewFriendDetails = async (friendId) => {
    setModalVisible(true);
    setLoadingFriend(true);
    setFriendFavorites([]);
    
    try {
      const res = await fetch(`${IP}/users/${friendId}/details`);
      const data = await res.json();
      if (data.success) {
        setSelectedFriend(data.user);
        const favIds = data.user.favorites.map(f => f.characterId);
        const richFavs = await fetchFriendFavoritesDetails(favIds);
        setFriendFavorites(richFavs);
      }
    } catch (err) {
      showToast("Failed to load profile");
    } finally {
      setLoadingFriend(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons key={star} name={star <= rating ? "star" : "star-outline"} size={14} color={theme.accent} />
        ))}
      </View>
    );
  };

  const animeFavs = friendFavorites.filter(f => f.type === 'anime');
  const mangaFavs = friendFavorites.filter(f => f.type === 'manga');
  const charFavs = friendFavorites.filter(f => f.type === 'characters');

  if (loading) return <View style={[styles.background, styles.centered, { backgroundColor: theme.fundal }]}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <SafeAreaView style={[styles.background, { backgroundColor: theme.fundal }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={{ opacity: fadeAnim }}>
          
          <View style={styles.profileSection}>
            <Text style={[styles.usernameText, { color: theme.accent }]}>{username}</Text>
          </View>

          <View style={[styles.quizResultContainer, { backgroundColor: theme.card, borderColor: theme.bordura }]}>
            {quizData ? (
              <>
                <Text style={[styles.quizTitle, { color: theme.textSecundar }]}>Personality Match</Text>
                <Text style={[styles.quizCharacter, { color: theme.text }]}>{quizData.character} <Text style={{fontSize: 14, color: theme.accent, fontWeight: 'normal'}}>({quizData.anime})</Text></Text>
                {quizData.reason !== "Manually selected" && (
                  <Text style={[styles.quizReason, { color: theme.textSecundar }]}>{quizData.reason}</Text>
                )}
                <View style={styles.quizSubtleActions}>
                  <TouchableOpacity onPress={resetQuiz}>
                    <Text style={[styles.subtleText, { color: theme.textSecundar }]}>Retake Quiz</Text>
                  </TouchableOpacity>
                  <Text style={{color: theme.bordura}}> • </Text>
                  <TouchableOpacity onPress={() => setShowManualInput(!showManualInput)}>
                    <Text style={[styles.subtleText, { color: theme.textSecundar }]}>Set Manually</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.quizTitle, { color: theme.textSecundar, marginBottom: 15 }]}>Discover your inner character</Text>
                <TouchableOpacity style={[styles.takeQuizBtn, { backgroundColor: theme.accent }]} onPress={() => router.push('/QuizScreen')}>
                  <Text style={[styles.takeQuizText, { color: theme.fundal }]}>Start Personality Quiz</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{marginTop: 15}} onPress={() => setShowManualInput(!showManualInput)}>
                  <Text style={[styles.subtleText, { color: theme.textSecundar, textAlign: 'center' }]}>Or set it manually</Text>
                </TouchableOpacity>
              </>
            )}

            {showManualInput && (
              <View style={styles.manualInputRow}>
                <TextInput 
                  style={[styles.manualInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.bordura }]} 
                  placeholder="Character name..." 
                  placeholderTextColor={theme.textSecundar}
                  value={manualCharInput}
                  onChangeText={setManualCharInput}
                />
                <TouchableOpacity style={[styles.manualBtn, { backgroundColor: theme.accent }]} onPress={setManualCharacter}>
                  <Text style={{color: theme.fundal, fontWeight: 'bold'}}>Set</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.bordura }]}><Ionicons name="people" size={28} color={theme.accent} /><Text style={[styles.statNumber, { color: theme.text }]}>{stats.likedCharacters}</Text><Text style={[styles.statLabel, { color: theme.textSecundar }]}>Chars</Text></View>
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.bordura }]}><Ionicons name="book" size={28} color={theme.accent} /><Text style={[styles.statNumber, { color: theme.text }]}>{stats.likedManga}</Text><Text style={[styles.statLabel, { color: theme.textSecundar }]}>Manga</Text></View>
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.bordura }]}><Ionicons name="tv" size={28} color={theme.accent} /><Text style={[styles.statNumber, { color: theme.text }]}>{stats.likedAnime}</Text><Text style={[styles.statLabel, { color: theme.textSecundar }]}>Anime</Text></View>
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.bordura }]}><Ionicons name="trending-up" size={28} color={theme.accent} /><Text style={[styles.statNumber, { color: theme.text }]}>{stats.inProgress}</Text><Text style={[styles.statLabel, { color: theme.textSecundar }]}>Progress</Text></View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecundar }]}>Community</Text>
          <View style={[styles.actionsContainer, { backgroundColor: theme.card, borderColor: theme.bordura, padding: 15, marginBottom: 20 }]}>
            <View style={styles.searchRow}>
              <TextInput style={[styles.searchInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.bordura }]} placeholder="Search users..." placeholderTextColor={theme.textSecundar} value={searchQuery} onChangeText={setSearchQuery} />
              <TouchableOpacity style={[styles.searchBtn, { backgroundColor: theme.accent }]} onPress={searchUsers}><Ionicons name="search" size={20} color={theme.fundal} /></TouchableOpacity>
            </View>
            {searchResults.map(u => (
              <View key={u.id} style={[styles.userRow, { borderColor: theme.bordura }]}>
                <Text style={{color: theme.text}}>{u.username}</Text>
                {!friends.some(f => f.id === u.id) && <TouchableOpacity onPress={() => addFriend(u.id)}><Ionicons name="person-add" size={20} color={theme.accent} /></TouchableOpacity>}
              </View>
            ))}
            <Text style={[styles.sectionTitle, { color: theme.textSecundar, marginTop: 15, marginLeft: 0 }]}>Friends List</Text>
            {friends.length === 0 && <Text style={{color: theme.textSecundar, fontSize: 13, marginTop: 5}}>No friends added yet.</Text>}
            {friends.map(f => (
              <TouchableOpacity key={f.id} style={[styles.friendRow, { borderColor: theme.bordura }]} onPress={() => viewFriendDetails(f.id)}>
                <Text style={{color: theme.text, fontWeight: 'bold'}}>{f.username}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.accent} />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecundar }]}>Preferences</Text>
          <View style={[styles.actionsContainer, { backgroundColor: theme.card, borderColor: theme.bordura }]}>
            <View style={[styles.actionRow, { borderBottomColor: theme.bordura }]}>
              <View style={styles.actionLeft}><Ionicons name={isDarkTheme ? "moon" : "sunny"} size={22} color={theme.accent} /><Text style={[styles.actionText, { color: theme.text }]}>Dark Theme</Text></View>
              <Switch value={isDarkTheme} onValueChange={toggleTheme} trackColor={{ false: theme.bordura, true: theme.accent }} thumbColor={"#FFFFFF"} />
            </View>
            <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
              <View style={styles.actionLeft}><Ionicons name="log-out-outline" size={24} color={theme.danger} /><Text style={[styles.actionText, { color: theme.danger }]}>Log Out</Text></View>
            </TouchableOpacity>
          </View>

        </Animated.View>

        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
          <View style={[styles.modalContainer, { backgroundColor: theme.fundal }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.bordura }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedFriend?.username}'s Profile</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close-circle" size={30} color={theme.textSecundar} /></TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              
              <Text style={[styles.sectionTitleModal, { color: theme.text }]}>Reviews & Comments <Text style={{color: theme.textSecundar, fontSize: 16}}>({selectedFriend?.comments?.length || 0})</Text></Text>
              {selectedFriend?.comments?.length > 0 ? (
                <View style={styles.commentsListContainer}>
                  {selectedFriend.comments.map((comment) => (
                    <View key={comment.id} style={[styles.profileCommentCard, { backgroundColor: theme.card, borderColor: theme.bordura }]}>
                      <View style={styles.profileCommentHeader}>
                        <Text style={[styles.profileCommentItemName, { color: theme.accent }]} numberOfLines={1}>{comment.itemName}</Text>
                        {renderStars(comment.rating)}
                      </View>
                      <Text style={[styles.profileCommentDate, { color: theme.textSecundar }]}>{new Date(comment.createdAt).toLocaleDateString()}</Text>
                      <Text style={[styles.profileCommentText, { color: theme.text }]}>{comment.text}</Text>
                    </View>
                  ))}
                </View>
              ) : (<Text style={[styles.emptyModalText, { color: theme.textSecundar }]}>No reviews posted yet.</Text>)}

              <Text style={[styles.sectionTitleModal, { color: theme.text }]}>In Progress <Text style={{color: theme.textSecundar, fontSize: 16}}>({selectedFriend?.progress?.length || 0})</Text></Text>
              {selectedFriend?.progress?.length > 0 ? (
                <FlatList horizontal showsHorizontalScrollIndicator={false} data={selectedFriend.progress} keyExtractor={(it) => it.id.toString()} contentContainerStyle={{ paddingRight: 20 }}
                  renderItem={({ item }) => (
                    <View style={styles.friendCard}>
                      <Image source={{ uri: item.image }} style={[styles.friendCardImage, { borderColor: theme.bordura }]} />
                      <Text style={[styles.friendCardTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                      <Text style={[styles.friendCardSubtitle, { color: theme.accent }]}>{item.type === 'anime' ? 'Ep' : 'Ch'} {item.current} / {item.total || '?'}</Text>
                    </View>
                  )}
                />
              ) : (<Text style={[styles.emptyModalText, { color: theme.textSecundar }]}>No items in progress.</Text>)}

              <Text style={[styles.sectionTitleModal, { color: theme.text }]}>Favorite Anime <Text style={{color: theme.textSecundar, fontSize: 16}}>({animeFavs.length})</Text></Text>
              {loadingFriend ? <ActivityIndicator size="small" color={theme.accent} /> : animeFavs.length > 0 ? (
                <FlatList horizontal showsHorizontalScrollIndicator={false} data={animeFavs} keyExtractor={(it) => it.id} contentContainerStyle={{ paddingRight: 20 }}
                  renderItem={({ item }) => (
                    <View style={styles.friendCard}>
                      <Image source={{ uri: item.image }} style={[styles.friendCardImage, { borderColor: theme.bordura }]} />
                      <Text style={[styles.friendCardTitle, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
                    </View>
                  )}
                />
              ) : (<Text style={[styles.emptyModalText, { color: theme.textSecundar }]}>No anime added.</Text>)}

              <Text style={[styles.sectionTitleModal, { color: theme.text }]}>Favorite Manga <Text style={{color: theme.textSecundar, fontSize: 16}}>({mangaFavs.length})</Text></Text>
              {loadingFriend ? <ActivityIndicator size="small" color={theme.accent} /> : mangaFavs.length > 0 ? (
                <FlatList horizontal showsHorizontalScrollIndicator={false} data={mangaFavs} keyExtractor={(it) => it.id} contentContainerStyle={{ paddingRight: 20 }}
                  renderItem={({ item }) => (
                    <View style={styles.friendCard}>
                      <Image source={{ uri: item.image }} style={[styles.friendCardImage, { borderColor: theme.bordura }]} />
                      <Text style={[styles.friendCardTitle, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
                    </View>
                  )}
                />
              ) : (<Text style={[styles.emptyModalText, { color: theme.textSecundar }]}>No manga added.</Text>)}

              <Text style={[styles.sectionTitleModal, { color: theme.text }]}>Favorite Characters <Text style={{color: theme.textSecundar, fontSize: 16}}>({charFavs.length})</Text></Text>
              {loadingFriend ? <ActivityIndicator size="small" color={theme.accent} /> : charFavs.length > 0 ? (
                <FlatList horizontal showsHorizontalScrollIndicator={false} data={charFavs} keyExtractor={(it) => it.id} contentContainerStyle={{ paddingRight: 20 }}
                  renderItem={({ item }) => (
                    <View style={styles.friendCard}>
                      <Image source={{ uri: item.image }} style={[styles.friendCardImage, { borderColor: theme.bordura }]} />
                      <Text style={[styles.friendCardTitle, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
                    </View>
                  )}
                />
              ) : (<Text style={[styles.emptyModalText, { color: theme.textSecundar }]}>No characters added.</Text>)}

            </ScrollView>
          </View>
        </Modal>
      </ScrollView>

      {toastMessage !== '' && (
        <View style={[styles.toastContainer, { backgroundColor: theme.accent }]}>
          <Text style={[styles.toastText, { color: theme.fundal }]}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 20,
  },
  usernameText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  quizResultContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 25,
  },
  quizTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quizCharacter: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quizReason: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  quizSubtleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  subtleText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  takeQuizBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  takeQuizText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  manualInputRow: {
    flexDirection: 'row',
    marginTop: 15,
  },
  manualInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  manualBtn: {
    marginLeft: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 2,
    borderRadius: 12,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 5,
  },
  actionsContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  searchBtn: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 10,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitleModal: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 15,
  },
  friendCard: {
    width: 110,
    marginLeft: 20,
    alignItems: 'center',
  },
  friendCardImage: {
    width: 110,
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  friendCardTitle: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  friendCardSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: 'bold',
  },
  commentsListContainer: {
    paddingHorizontal: 20,
  },
  profileCommentCard: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  profileCommentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileCommentItemName: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  profileCommentDate: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 8,
  },
  profileCommentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyModalText: {
    marginHorizontal: 20,
    fontSize: 14,
    fontStyle: 'italic',
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