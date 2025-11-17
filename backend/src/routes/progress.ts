import express from 'express';
import { db, Collections } from '../services/firestore.js';
import { GameProgress, SaveProgressRequest } from '../models/Progress.js';

const router = express.Router();

// Save game progress
router.post('/', async (req, res) => {
  try {
    const { userId, gameId, score, level, data }: SaveProgressRequest = req.body;

    // Validate input
    if (!userId || !gameId) {
      return res.status(400).json({ error: 'userId and gameId are required' });
    }

    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    if (typeof level !== 'number' || level < 0) {
      return res.status(400).json({ error: 'Invalid level' });
    }

    // Check if user exists
    const userDoc = await db.collection(Collections.USERS).doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find existing progress for this user and game
    const existingProgress = await db
      .collection(Collections.PROGRESS)
      .where('userId', '==', userId)
      .where('gameId', '==', gameId)
      .limit(1)
      .get();

    if (!existingProgress.empty) {
      // Update existing progress
      const progressDoc = existingProgress.docs[0];
      const updatedProgress: Partial<GameProgress> = {
        score,
        level,
        data: data || {},
        updatedAt: new Date(),
      };

      await progressDoc.ref.update(updatedProgress);

      const updated = await progressDoc.ref.get();
      res.json(updated.data() as GameProgress);
    } else {
      // Create new progress entry
      const progressRef = db.collection(Collections.PROGRESS).doc();
      const newProgress: GameProgress = {
        id: progressRef.id,
        userId,
        gameId,
        score,
        level,
        data: data || {},
        updatedAt: new Date(),
      };

      await progressRef.set(newProgress);
      res.status(201).json(newProgress);
    }
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get progress for a specific user and game
router.get('/:userId/:gameId', async (req, res) => {
  try {
    const { userId, gameId } = req.params;

    const progressSnapshot = await db
      .collection(Collections.PROGRESS)
      .where('userId', '==', userId)
      .where('gameId', '==', gameId)
      .limit(1)
      .get();

    if (progressSnapshot.empty) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    res.json(progressSnapshot.docs[0].data() as GameProgress);
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all progress for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const progressSnapshot = await db
      .collection(Collections.PROGRESS)
      .where('userId', '==', userId)
      .get();

    const allProgress = progressSnapshot.docs.map(doc => doc.data() as GameProgress);
    res.json(allProgress);
  } catch (error) {
    console.error('Error getting user progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
