import { describe, it, expect } from 'vitest';
import { lessons } from '../lessons';

const ALLOWED_CHARS = new Set([
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '.', '+', '-', '*', '/', ' ',
]);

describe('Numpad lessons', () => {
  it('should have exactly 10 lessons', () => {
    expect(lessons).toHaveLength(10);
  });

  it('should have at least 10 exercises in every lesson', () => {
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

  it('should only contain numpad-reachable characters', () => {
    lessons.forEach((lesson, lessonIdx) => {
      lesson.exercises.forEach((exercise, exIdx) => {
        for (const char of exercise) {
          expect(
            ALLOWED_CHARS.has(char),
            `Lesson ${lessonIdx + 1} exercise ${exIdx + 1} contains illegal char "${char}"`
          ).toBe(true);
        }
      });
    });
  });

  it('should start with home-row digits (4, 5, 6) in lesson 1', () => {
    const firstLesson = lessons[0];
    const allChars = firstLesson.exercises.join('');
    expect(allChars).toMatch(/4/);
    expect(allChars).toMatch(/5/);
    expect(allChars).toMatch(/6/);
    // No 0/1/2/3/7/8/9 in lesson 1
    expect(allChars).not.toMatch(/[012378]/);
    // 9 only appears as part of " 4" etc — confirm there's truly no 9
    expect(allChars).not.toMatch(/9/);
  });

  it('should introduce all ten digits by lesson 4', () => {
    const charsByLesson4 = lessons.slice(0, 4).map((l) => l.exercises.join('')).join('');
    for (let d = 0; d <= 9; d++) {
      expect(charsByLesson4).toContain(String(d));
    }
  });

  it('should introduce operators in later lessons', () => {
    const lesson5 = lessons[4].exercises.join('');
    const lesson6 = lessons[5].exercises.join('');
    expect(lesson5).toMatch(/[+-]/);
    expect(lesson6).toMatch(/[*/]/);
  });
});
