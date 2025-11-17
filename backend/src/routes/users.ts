import express from 'express';
import { db, Collections } from '../services/firestore.js';
import { User, CreateUserRequest, isValidAvatar } from '../models/User.js';

const router = express.Router();

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { username, avatar }: CreateUserRequest = req.body;

    // Validate input
    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters' });
    }

    if (!avatar || !isValidAvatar(avatar)) {
      return res.status(400).json({ error: 'Invalid avatar' });
    }

    // Check if username already exists
    const existingUsers = await db
      .collection(Collections.USERS)
      .where('username', '==', username.trim())
      .limit(1)
      .get();

    if (!existingUsers.empty) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Create user
    const userRef = db.collection(Collections.USERS).doc();
    const newUser: User = {
      id: userRef.id,
      username: username.trim(),
      avatar,
      createdAt: new Date(),
    };

    await userRef.set(newUser);

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const userDoc = await db.collection(Collections.USERS).doc(id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userDoc.data() as User);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user avatar
router.put('/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
    const { avatar } = req.body;

    if (!avatar || !isValidAvatar(avatar)) {
      return res.status(400).json({ error: 'Invalid avatar' });
    }

    const userRef = db.collection(Collections.USERS).doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userRef.update({ avatar });

    const updatedUser = await userRef.get();
    res.json(updatedUser.data() as User);
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
