import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

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
      select: { username: true }
    });
    if (!user) return res.json({ success: false });

    const favorites = await prisma.favoriteCharacter.findMany({ where: { userId: targetId } });
    const progress = await prisma.progressItem.findMany({ where: { userId: targetId } });

    res.json({ success: true, user: { username: user.username, favorites, progress } });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {});