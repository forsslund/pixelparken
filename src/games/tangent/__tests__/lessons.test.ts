import { describe, it, expect } from 'vitest';
import { lessons } from '../lessons';

describe('Lessons', () => {
  it('should have exactly 10 lessons', () => {
    expect(lessons).toHaveLength(10);
  });

  it('should have exercises in each lesson', () => {
    lessons.forEach((lesson) => {
      expect(lesson.exercises).toBeDefined();
      expect(lesson.exercises.length).toBeGreaterThan(0);
    });
  });

  it('should have at least 10 exercises per lesson', () => {
    lessons.forEach((lesson) => {
      expect(lesson.exercises.length).toBeGreaterThanOrEqual(10);
    });
  });

  it('should have all exercises as non-empty strings', () => {
    lessons.forEach((lesson) => {
      lesson.exercises.forEach((exercise) => {
        expect(typeof exercise).toBe('string');
        expect(exercise.length).toBeGreaterThan(0);
      });
    });
  });

  it('should start with basic home row exercises in lesson 1', () => {
    const firstLesson = lessons[0];
    const firstExercise = firstLesson.exercises[0];

    // First exercise should contain f and j (home row keys)
    expect(firstExercise).toContain('f');
    expect(firstExercise).toContain('j');
  });

  it('should have progressively complex lessons', () => {
    // Lesson 1 should be simpler (shorter exercises on average)
    const lesson1AvgLength =
      lessons[0].exercises.reduce((sum, ex) => sum + ex.length, 0) /
      lessons[0].exercises.length;

    // Later lessons should have more complex exercises
    const lesson10AvgLength =
      lessons[9].exercises.reduce((sum, ex) => sum + ex.length, 0) /
      lessons[9].exercises.length;

    expect(lesson10AvgLength).toBeGreaterThan(lesson1AvgLength);
  });
});
