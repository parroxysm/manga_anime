import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

/* =========================
   REGISTER
========================= */
app.post('/register', async (req, res) => { 
  try {
    const { username, password, confirmpassword } = req.body;

    if (!username || !password || !confirmpassword) {
      return res.json({ success: false });
    }

    if (password !== confirmpassword) {
      return res.json({ success: false });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.json({ success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword
      }
    });

    return res.json({ success: true });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});


/* =========================
   LOGIN (IMPORTANT)
========================= */
/* =========================
   LOGIN (DEBUG MODE)
========================= */
app.post('/login', async (req, res) => {
  console.log("=== INCERCARE DE LOGARE ===");
  console.log("Date primite de la telefon:", req.body);

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log("Eroare: Userul sau parola sunt goale!");
      return res.json({ success: false });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      console.log("Eroare: Username-ul NU exista in baza de date:", `"${username}"`);
      return res.json({ success: false });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log("Eroare: Parola este GRESITA pentru userul:", username);
      return res.json({ success: false });
    }

    console.log("LOGARE REUSITA! User ID:", user.id);
    return res.json({
      success: true,
      userId: user.id
    });

  } catch (err) {
    console.log("Eroare critica la login:", err);
    return res.status(500).json({ success: false });
  }
});

app.delete('/delete-user', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.json({ success: false, message: "No username provided" });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    await prisma.user.delete({
      where: { username }
    });

    return res.json({ success: true });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
});

app.post('/toggle-favorite', async (req, res) => {
  console.log("BODY RECEIVED:", req.body);
  try {
    console.log("BODY:", req.body);

    const userId = parseInt(req.body.userId, 10);
    const characterId = String(req.body.characterId);

    if (!userId || !characterId) {
      return res.json({ success: false, message: "Missing data" });
    }

    const existing = await prisma.favoriteCharacter.findFirst({
      where: { userId, characterId }
    });

    if (existing) {
      await prisma.favoriteCharacter.deleteMany({
        where: { userId, characterId }
      });

      return res.json({ success: true, action: "removed" });
    }

    await prisma.favoriteCharacter.create({
      data: { userId, characterId }
    });

    return res.json({ success: true, action: "added" });

  } catch (err) {
    console.log("TOGGLE ERROR:", err);
    return res.status(500).json({ success: false });
  }
});

app.get('/favorites', async (req, res) => {
  try {
    const userId = Number(req.query.userId);

    if (!userId) {
      return res.json({ favorites: [] });
    }

    const favorites = await prisma.favoriteCharacter.findMany({ 
      where: { userId }
    });

    res.json({ favorites });
  } catch (err) {
    console.log("ERROR FAVORITES:", err);
    res.status(500).json({ success: false });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});