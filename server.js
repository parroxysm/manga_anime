import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json());

app.post('/register', async (req, res) => { 
  try {
    const { username, password, confirmpassword } = req.body;
    if (!username || !password || !confirmpassword) return res.json({ success: false });
    if (password !== confirmpassword) return res.json({ success: false });
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) return res.json({ success: false });
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { username, password: hashedPassword } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.json({ success: false });
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.json({ success: false });
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.json({ success: false });
    return res.json({ success: true, userId: user.id });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

app.post('/toggle-favorite', async (req, res) => {
  try {
    const userId = parseInt(req.body.userId, 10);
    const characterId = String(req.body.characterId);
    if (!userId || !characterId) return res.json({ success: false });
    const existing = await prisma.favoriteCharacter.findFirst({ where: { userId, characterId } });
    if (existing) {
      await prisma.favoriteCharacter.deleteMany({ where: { userId, characterId } });
      return res.json({ success: true, action: "removed" });
    }
    await prisma.favoriteCharacter.create({ data: { userId, characterId } });
    return res.json({ success: true, action: "added" });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

app.get('/favorites', async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (!userId) return res.json({ favorites: [] });
    const favorites = await prisma.favoriteCharacter.findMany({ where: { userId } });
    res.json({ favorites });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get('/progress', async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (!userId) return res.json({ progress: [] });
    const progress = await prisma.progressItem.findMany({ where: { userId } });
    res.json({ progress });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.post('/progress', async (req, res) => {
  try {
    const { userId, itemId, title, type, image, total, current } = req.body;
    if (!userId || !itemId) return res.json({ success: false });
    const parsedTotal = total ? parseInt(total, 10) : null;
    const parsedCurrent = current !== undefined ? parseInt(current, 10) : 0;
    const existing = await prisma.progressItem.findFirst({ where: { userId, itemId } });
    if (existing) {
      const updated = await prisma.progressItem.update({
        where: { id: existing.id },
        data: { current: parsedCurrent }
      });
      return res.json({ success: true, item: updated });
    }
    const newItem = await prisma.progressItem.create({
      data: { userId, itemId, title, type, image, total: parsedTotal, current: parsedCurrent }
    });
    return res.json({ success: true, item: newItem });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

app.delete('/progress', async (req, res) => {
  try {
    const { userId, itemId } = req.body;
    await prisma.progressItem.deleteMany({ where: { userId: Number(userId), itemId: String(itemId) } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

app.get('/users/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const userId = Number(req.query.userId);
    const users = await prisma.user.findMany({
      where: { username: { contains: q }, NOT: { id: userId } },
      select: { id: true, username: true }
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get('/friends', async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    const friendsData = await prisma.friend.findMany({
      where: { userId },
      include: { friend: { select: { id: true, username: true } } }
    });
    res.json({ friends: friendsData.map(f => f.friend) });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.post('/friends/add', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    const existing = await prisma.friend.findFirst({ where: { userId, friendId } });
    if (!existing) await prisma.friend.create({ data: { userId, friendId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.delete('/friends/remove', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    await prisma.friend.deleteMany({ where: { userId, friendId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get('/users/:id/details', async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: { username: true, quizCharacter: true, quizImage: true }
    });
    if (!user) return res.json({ success: false });
    const favorites = await prisma.favoriteCharacter.findMany({ where: { userId: targetId } });
    const progress = await prisma.progressItem.findMany({ where: { userId: targetId } });
    const comments = await prisma.comment.findMany({
      where: { userId: targetId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, user: { ...user, favorites, progress, comments } });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get('/profile/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: { quizCharacter: true, quizImage: true }
    });
    res.json({ success: true, profile: user });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.post('/profile/quiz', async (req, res) => {
  try {
    const { userId, character, image } = req.body;
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { quizCharacter: character, quizImage: image }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.delete('/profile/quiz', async (req, res) => {
  try {
    const { userId } = req.body;
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { quizCharacter: null, quizImage: null }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.post('/comments', async (req, res) => {
  try {
    const { userId, itemId, itemName, type, rating, text } = req.body;
    if (!userId || !itemId || !rating || !text) return res.json({ success: false });
    const comment = await prisma.comment.create({
      data: {
        userId: Number(userId),
        itemId: String(itemId),
        itemName: String(itemName),
        type: String(type),
        rating: Number(rating),
        text: String(text)
      },
      include: { user: { select: { username: true } } }
    });
    res.json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get('/comments/:itemId', async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { itemId: req.params.itemId },
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, comments });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.post('/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Ești un asistent expert în manga și anime. Răspunde concis, prietenos și la obiect. Întrebarea: ${message}`
    });
    res.json({ success: true, reply: response.text });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.post('/ai/quiz', async (req, res) => {
  try {
    const { answers } = req.body;
    const prompt = `Analizează următoarele răspunsuri la un test de personalitate și alege un singur personaj din anime care se potrivește cel mai bine profilului psihologic. Răspunde DOAR cu numele personajului în format text simplu, fără alte explicații sau ghilimele. Răspunsuri: ${JSON.stringify(answers)}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    const characterName = response.text.trim();
    
    const jikanRes = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(characterName)}&limit=1`);
    const jikanData = await jikanRes.json();
    let imageUrl = '';
    let finalName = characterName;
    
    if (jikanData.data && jikanData.data.length > 0) {
      imageUrl = jikanData.data[0].images.jpg.image_url;
      finalName = jikanData.data[0].name;
    }

    res.json({ success: true, character: finalName, image: imageUrl });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {});