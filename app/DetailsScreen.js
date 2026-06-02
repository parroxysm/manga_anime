import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import IP from '../var/IP';
import { LIGHT, DARK } from '../var/Culori';

export default function DetailsScreen() {
  const item = useLocalSearchParams();
  const router = useRouter();
  const [theme, setTheme] = useState(LIGHT);
  const [extraData, setExtraData] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentRating, setNewCommentRating] = useState(0);
  const [loadingComments, setLoadingComments] = useState(true);

  const [toastMessage, setToastMessage] = useState('');
  const toastTimeout = useRef(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('isDarkTheme').then(val => setTheme(val === 'true' ? DARK : LIGHT));
    }, [])
  );

  const showToast = (message) => {
    setToastMessage(message);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    const fetchDetails = async () => {
      if (!item.actualId) return;
      try {
        setLoadingExtras(true);
        if (item.type === 'characters') {
          const charRes = await fetch(`https://api.jikan.moe/v4/characters/${item.actualId}/full`);
          const charJson = await charRes.json();
          setExtraData(charJson.data);
          let related = [];
          if (charJson.data?.anime) related = [...related, ...charJson.data.anime.map(a => ({ actualId: a.anime.mal_id, id: `anime_${a.anime.mal_id}`, name: a.anime.title, image: a.anime.images?.jpg?.image_url, type: 'anime' }))];
          if (charJson.data?.manga) related = [...related, ...charJson.data.manga.map(m => ({ actualId: m.manga.mal_id, id: `manga_${m.manga.mal_id}`, name: m.manga.title, image: m.manga.images?.jpg?.image_url, type: 'manga' }))];
          setRelatedItems(related.slice(0, 15));
        } else {
          const fullRes = await fetch(`https://api.jikan.moe/v4/${item.type}/${item.actualId}/full`);
          const fullJson = await fullRes.json();
          setExtraData(fullJson.data);
          const charsRes = await fetch(`https://api.jikan.moe/v4/${item.type}/${item.actualId}/characters`);
          const charsJson = await charsRes.json();
          if (charsJson.data) {
            const related = charsJson.data.map(c => ({ actualId: c.character.mal_id, id: `char_${c.character.mal_id}`, name: c.character.name, image: c.character.images?.jpg?.image_url, type: 'characters' }));
            setRelatedItems(related.slice(0, 15));
          }
        }
      } catch (error) {
      } finally {
        setLoadingExtras(false);
      }
    };
    fetchDetails();
  }, [item.actualId, item.type]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!item.id) return;
      try {
        setLoadingComments(true);
        const res = await fetch(`${IP}/comments/${item.id}`);
        const data = await res.json();
        if (data.success) {
          setComments(data.comments);
        }
      } catch (error) {
      } finally {
        setLoadingComments(false);
      }
    };
    fetchComments();
  }, [item.id]);

  const addToProgress = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      
      let parsedTotal = null;
      if (item.total && item.total !== 'null' && item.total !== 'undefined') {
        parsedTotal = parseInt(item.total, 10);
      } else if (extraData?.episodes || extraData?.chapters) {
        parsedTotal = extraData.episodes || extraData.chapters;
      }
      if (isNaN(parsedTotal)) parsedTotal = null;
      
      const res = await fetch(`${IP}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: Number(userId), 
          itemId: item.id, 
          title: item.name, 
          type: item.type, 
          image: item.image, 
          total: parsedTotal 
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Added to your list!");
      } else {
        showToast("Failed to add to progress.");
      }
    } catch (error) {
      showToast("Network error.");
    }
  };

  const submitComment = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        showToast("Please log in to comment");
        return;
      }
      if (!newCommentText.trim()) {
        showToast("Please write a comment");
        return;
      }
      if (newCommentRating === 0) {
        showToast("Please select a rating");
        return;
      }

      const res = await fetch(`${IP}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(userId),
          itemId: item.id,
          itemName: item.name,
          type: item.type,
          rating: newCommentRating,
          text: newCommentText.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setComments([data.comment, ...comments]);
        setNewCommentText('');
        setNewCommentRating(0);
        showToast("Comment posted!");
      } else {
        showToast("Failed to post comment");
      }
    } catch (error) {
      showToast("Network error.");
    }
  };

  const renderStars = (rating, interactive = false) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity 
            key={star} 
            disabled={!interactive} 
            onPress={() => interactive && setNewCommentRating(star)}
          >
            <Ionicons 
              name={star <= rating ? "star" : "star-outline"} 
              size={interactive ? 30 : 16} 
              color={theme.accent} 
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.background, { backgroundColor: theme.fundal }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Image source={{ uri: String(item.image) }} style={[styles.imageAnimeCard, { borderColor: theme.bordura }]} />
        <View style={styles.content}>
          <Text style={[styles.nameAnimeCard, { color: theme.text }]}>{item.name}</Text>
          <View style={[styles.separator, { backgroundColor: theme.textSecundar }]} />
          
          {extraData && (
            <View style={styles.tagsContainer}>
              {extraData.score && <View style={[styles.tag, { backgroundColor: theme.card, borderColor: theme.bordura }]}><Text style={[styles.tagText, { color: theme.text }]}>⭐ {extraData.score}</Text></View>}
              {extraData.year && <View style={[styles.tag, { backgroundColor: theme.card, borderColor: theme.bordura }]}><Text style={[styles.tagText, { color: theme.text }]}>{extraData.year}</Text></View>}
              {extraData.status && <View style={[styles.tag, { backgroundColor: theme.card, borderColor: theme.bordura }]}><Text style={[styles.tagText, { color: theme.text }]}>{extraData.status}</Text></View>}
              {extraData.genres?.slice(0, 3).map((g) => <View key={g.mal_id} style={[styles.tag, { backgroundColor: theme.card, borderColor: theme.bordura }]}><Text style={[styles.tagText, { color: theme.text }]}>{g.name}</Text></View>)}
            </View>
          )}

          {extraData && item.type !== 'characters' && (
            <View style={[styles.additionalInfoContainer, { backgroundColor: theme.card, borderColor: theme.bordura }]}>
              {extraData.rank && <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: theme.textSecundar }]}>Rank:</Text><Text style={[styles.infoValue, { color: theme.text }]}>#{extraData.rank}</Text></View>}
              {extraData.popularity && <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: theme.textSecundar }]}>Popularity:</Text><Text style={[styles.infoValue, { color: theme.text }]}>#{extraData.popularity}</Text></View>}
              {extraData.studios?.length > 0 && <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: theme.textSecundar }]}>Studio:</Text><Text style={[styles.infoValue, { color: theme.text }]}>{extraData.studios[0].name}</Text></View>}
              {extraData.authors?.length > 0 && <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: theme.textSecundar }]}>Author:</Text><Text style={[styles.infoValue, { color: theme.text }]}>{extraData.authors[0].name}</Text></View>}
            </View>
          )}

          <Text style={[styles.aboutAnimeCard, { color: theme.text }]}>{extraData?.synopsis || extraData?.about || item.about}</Text>

          {item.type !== 'characters' && (
            <TouchableOpacity style={[styles.butonProgres, { backgroundColor: theme.accent }]} onPress={addToProgress}>
              <Text style={[styles.textButonProgres, { color: theme.fundal }]}>+ Add to your list</Text>
            </TouchableOpacity>
          )}

          <View style={styles.reviewsSection}>
            <Text style={[styles.relatedTitle, { color: theme.text }]}>Reviews</Text>
            
            <View style={[styles.addCommentContainer, { backgroundColor: theme.card, borderColor: theme.bordura }]}>
              <Text style={[styles.addCommentTitle, { color: theme.text }]}>Leave a review</Text>
              <View style={styles.interactiveStarsContainer}>
                {renderStars(newCommentRating, true)}
              </View>
              <TextInput
                style={[styles.commentInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.bordura }]}
                placeholder="Write your thoughts..."
                placeholderTextColor={theme.textSecundar}
                multiline
                numberOfLines={3}
                value={newCommentText}
                onChangeText={setNewCommentText}
              />
              <TouchableOpacity style={[styles.submitCommentButton, { backgroundColor: theme.accent }]} onPress={submitComment}>
                <Text style={[styles.submitCommentText, { color: theme.fundal }]}>Post Review</Text>
              </TouchableOpacity>
            </View>

            {loadingComments ? (
              <ActivityIndicator size="small" color={theme.accent} style={{ marginTop: 20 }} />
            ) : comments.length > 0 ? (
              comments.map((c) => (
                <View key={c.id} style={[styles.commentCard, { backgroundColor: theme.card, borderColor: theme.bordura }]}>
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentUser, { color: theme.accent }]}>{c.user.username}</Text>
                    {renderStars(c.rating)}
                  </View>
                  <Text style={[styles.commentDate, { color: theme.textSecundar }]}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                  <Text style={[styles.commentText, { color: theme.text }]}>{c.text}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.noCommentsText, { color: theme.textSecundar }]}>No reviews yet. Be the first!</Text>
            )}
          </View>

          {loadingExtras ? (
            <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 30 }} />
          ) : (
            relatedItems.length > 0 && (
              <View style={styles.relatedSection}>
                <Text style={[styles.relatedTitle, { color: theme.text }]}>{item.type === 'characters' ? 'Featured In' : 'Characters'}</Text>
                <FlatList
                  horizontal showsHorizontalScrollIndicator={false}
                  data={relatedItems}
                  keyExtractor={(it, index) => `${it.id}-${index}`}
                  renderItem={({ item: relatedItem }) => (
                    <TouchableOpacity style={styles.relatedCard} onPress={() => router.push({ pathname: '/DetailsScreen', params: relatedItem })}>
                      <Image source={{ uri: relatedItem.image }} style={[styles.relatedImage, { borderColor: theme.bordura }]} />
                      <Text style={[styles.relatedName, { color: theme.text }]} numberOfLines={2}>{relatedItem.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )
          )}
        </View>
      </ScrollView>

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
  },
  imageAnimeCard: {
    borderRadius: 20,
    marginTop: 20,
    alignSelf: 'center',
    width: '92%',
    height: 450,
    resizeMode: 'cover',
    borderWidth: 1,
  },
  content: {
    padding: 20,
  },
  nameAnimeCard: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  separator: {
    height: 3,
    width: 60,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  additionalInfoContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  aboutAnimeCard: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'justify',
  },
  butonProgres: {
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    marginBottom: 10,
    alignItems: 'center',
  },
  textButonProgres: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  reviewsSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  addCommentContainer: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  addCommentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  interactiveStarsContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  submitCommentButton: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitCommentText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  commentCard: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  commentDate: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noCommentsText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 10,
  },
  relatedSection: {
    marginTop: 30,
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  relatedCard: {
    width: 100,
    marginRight: 15,
    alignItems: 'center',
  },
  relatedImage: {
    width: 100,
    height: 140,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  relatedName: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
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