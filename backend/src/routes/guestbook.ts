import express from 'express';
import { db, Collections } from '../services/firestore.js';
import { GuestbookEntry, CreateGuestbookEntryRequest } from '../models/GuestbookEntry.js';
import { isValidAvatar } from '../models/User.js';

const router = express.Router();

// Get guestbook entries (paginated, most recent first)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const guestbookSnapshot = await db
      .collection(Collections.GUESTBOOK)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const entries = guestbookSnapshot.docs.map(doc => doc.data() as GuestbookEntry);
    res.json(entries);
  } catch (error) {
    console.error('Error getting guestbook entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new guestbook entry
router.post('/', async (req, res) => {
  try {
    const { username, message, avatar }: CreateGuestbookEntryRequest = req.body;

    // Validate input
    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters' });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 1) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({ error: 'Message is too long (max 500 characters)' });
    }

    if (!avatar || !isValidAvatar(avatar)) {
      return res.status(400).json({ error: 'Invalid avatar' });
    }

    // Create guestbook entry
    const entryRef = db.collection(Collections.GUESTBOOK).doc();
    const newEntry: GuestbookEntry = {
      id: entryRef.id,
      username: username.trim(),
      message: message.trim(),
      avatar,
      createdAt: new Date(),
    };

    await entryRef.set(newEntry);

    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error creating guestbook entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
