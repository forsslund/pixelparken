import Phaser from 'phaser';
import { lessons } from './lessons';

/**
 * Swedish keyboard layout for visualization
 */
const KEYBOARD_LAYOUT = [
  ['§', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '´'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'å', '¨'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä', "'"],
  ['<', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-'],
  ['Space']
];

interface ProgressData {
  currentLesson: number;
  currentExercise: number;
}

export class TangentGame extends Phaser.Scene {
  private currentLesson = 0;
  private currentExercise = 0;
  private currentText = '';
  private currentCharIndex = 0;

  private textDisplayDOM?: HTMLDivElement;
  private lessonText?: Phaser.GameObjects.Text;
  private exerciseText?: Phaser.GameObjects.Text;
  private instructionText?: Phaser.GameObjects.Text;

  // Keyboard visualization
  private keyboardKeys: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private keyboardLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private currentHighlightedKey?: string;

  constructor() {
    super({ key: 'TangentGame' });
  }

  create(): void {
    // Load progress from localStorage
    this.loadProgress();

    // Set background
    this.cameras.main.setBackgroundColor('#2d3436');

    // Create UI elements
    this.createHeader();
    this.createInstructions();
    this.createTextDisplay();
    this.createKeyboard();

    // Set up keyboard input
    this.setupKeyboardInput();

    // Load current exercise
    this.loadExercise();
  }

  private createHeader(): void {
    const headerBg = this.add.rectangle(360, 40, 680, 60, 0x34495e);
    headerBg.setStrokeStyle(2, 0x7f8c8d);

    this.add.text(360, 30, '⌨️ Tangentträning', {
      fontSize: '24px',
      color: '#ecf0f1',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Lesson and exercise counters
    this.lessonText = this.add.text(135, 50, '', {
      fontSize: '16px',
      color: '#bdc3c7'
    }).setOrigin(0.5);

    this.exerciseText = this.add.text(585, 50, '', {
      fontSize: '16px',
      color: '#bdc3c7'
    }).setOrigin(0.5);

    this.updateCounters();
  }

  private createInstructions(): void {
    this.instructionText = this.add.text(360, 100, 'Skriv texten som visas nedan. Den markerade bokstaven är nästa att skriva.', {
      fontSize: '14px',
      color: '#95a5a6',
      wordWrap: { width: 630 }
    }).setOrigin(0.5);
  }

  private createTextDisplay(): void {
    // Create DOM element for text display
    this.textDisplayDOM = document.createElement('div');
    this.textDisplayDOM.style.position = 'absolute';
    this.textDisplayDOM.style.left = '50%';
    this.textDisplayDOM.style.top = '260px';
    this.textDisplayDOM.style.transform = 'translateX(-50%)';
    this.textDisplayDOM.style.width = '100%';
    this.textDisplayDOM.style.maxWidth = '100%';
    this.textDisplayDOM.style.fontSize = '20px';
    this.textDisplayDOM.style.color = '#ecf0f1';
    this.textDisplayDOM.style.fontFamily = 'Consolas, Courier, monospace';
    this.textDisplayDOM.style.textAlign = 'center';
    this.textDisplayDOM.style.lineHeight = '1.2';
    this.textDisplayDOM.style.whiteSpace = 'nowrap';
    this.textDisplayDOM.style.overflow = 'visible';
    this.textDisplayDOM.style.zIndex = '1000';
    this.textDisplayDOM.style.pointerEvents = 'none';

    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.position = 'relative';
      gameContainer.appendChild(this.textDisplayDOM);
    }
  }

  private createKeyboard(): void {
    const startX = 90;
    const startY = 222;
    const keyWidth = 45;
    const keyHeight = 36;
    const keySpacing = 3;

    let currentY = startY;

    KEYBOARD_LAYOUT.forEach((row, rowIndex) => {
      let currentX = startX + (rowIndex * 15); // Offset each row slightly

      row.forEach((key) => {
        const isSpace = key === 'Space';
        const width = isSpace ? 300 : keyWidth;
        const label = isSpace ? 'Mellanslag' : key;

        // Center the space bar
        if (isSpace) {
          currentX = 360; // Center of 720px canvas
        }

        // Create key background
        const keyRect = this.add.rectangle(currentX, currentY, width, keyHeight, 0x34495e);
        keyRect.setStrokeStyle(2, 0x7f8c8d);

        // Create key label
        const keyLabel = this.add.text(currentX, currentY, label, {
          fontSize: isSpace ? '14px' : '16px',
          color: '#ecf0f1',
          fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Store references
        const mapKey = key === 'Space' ? ' ' : key;
        this.keyboardKeys.set(mapKey, keyRect);
        this.keyboardLabels.set(mapKey, keyLabel);

        if (!isSpace) {
          currentX += width + keySpacing;
        }
      });

      currentY += keyHeight + keySpacing;
    });

    // Add special note
    this.add.text(360, currentY + 15, 'Tangentbordet visar vilka tangenter som trycks', {
      fontSize: '12px',
      color: '#7f8c8d',
      fontStyle: 'italic'
    }).setOrigin(0.5);
  }

  private setupKeyboardInput(): void {
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      // Prevent default browser behavior
      event.preventDefault();

      const char = event.key;

      // Handle backspace for visual feedback only
      if (char === 'Backspace') {
        this.highlightKey('Backspace', 0xff6b6b);
        return;
      }

      // Check if it matches the expected character
      if (this.checkCharacter(char)) {
        this.highlightKey(char, 0x00b894); // Green for correct
        this.currentCharIndex++;

        // Check if exercise is complete
        if (this.currentCharIndex >= this.currentText.length) {
          this.completeExercise();
        } else {
          this.updateTextDisplay();
        }
      } else {
        this.highlightKey(char, 0xd63031); // Red for wrong
      }
    });
  }

  private checkCharacter(inputChar: string): boolean {
    if (this.currentCharIndex >= this.currentText.length) {
      return false;
    }

    const expectedChar = this.currentText[this.currentCharIndex];
    return inputChar === expectedChar;
  }

  private highlightKey(key: string, color: number): void {
    const keyRect = this.keyboardKeys.get(key.toLowerCase()) ||
                   this.keyboardKeys.get(key.toUpperCase()) ||
                   (key === ' ' ? this.keyboardKeys.get(' ') : null);

    if (keyRect) {
      // Flash the key
      keyRect.setFillStyle(color);
      this.time.delayedCall(200, () => {
        // Return to normal or expected key highlight color
        const isCurrentExpected = this.currentHighlightedKey === key ||
                                  this.currentHighlightedKey === key.toLowerCase() ||
                                  this.currentHighlightedKey === key.toUpperCase();
        keyRect.setFillStyle(isCurrentExpected ? 0xf39c12 : 0x34495e);
      });
    }
  }

  private highlightExpectedKey(): void {
    // Clear previous highlight
    if (this.currentHighlightedKey) {
      const prevKeyRect = this.keyboardKeys.get(this.currentHighlightedKey);
      if (prevKeyRect) {
        prevKeyRect.setFillStyle(0x34495e);
      }
      this.currentHighlightedKey = undefined;
    }

    // Highlight the next expected key
    if (this.currentCharIndex < this.currentText.length) {
      const expectedChar = this.currentText[this.currentCharIndex];
      const keyRect = this.keyboardKeys.get(expectedChar.toLowerCase()) ||
                     this.keyboardKeys.get(expectedChar.toUpperCase()) ||
                     (expectedChar === ' ' ? this.keyboardKeys.get(' ') : null);

      if (keyRect) {
        keyRect.setFillStyle(0xf39c12); // Orange color for expected key
        this.currentHighlightedKey = expectedChar === ' ' ? ' ' : expectedChar.toLowerCase();
      }
    }
  }

  private updateTextDisplay(): void {
    if (!this.textDisplayDOM) return;

    // Build HTML text with highlighted character
    let displayHTML = '';
    const lines = this.currentText.split('\n');
    let charCount = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const escapedChar = char === '<' ? '&lt;' : char === '>' ? '&gt;' : char === '&' ? '&amp;' : char;
        const displayChar = char === ' ' ? '␣' : escapedChar;

        if (charCount === this.currentCharIndex) {
          // Current character - highlight with yellow background
          displayHTML += `<span style="background-color: #f1c40f; color: #000; padding: 2px 4px; border-radius: 3px; font-weight: bold;">${displayChar}</span>`;
        } else if (charCount < this.currentCharIndex) {
          // Already typed - show in green
          displayHTML += `<span style="color: #00b894;">${displayChar}</span>`;
        } else {
          // Not yet typed - show normal
          displayHTML += displayChar;
        }

        charCount++;
      }

      if (lineIdx < lines.length - 1) {
        displayHTML += '\n';
        charCount++; // Count the newline
      }
    }

    this.textDisplayDOM.innerHTML = displayHTML;

    // Highlight the expected key on the keyboard
    this.highlightExpectedKey();
  }

  private loadExercise(): void {
    if (this.currentLesson >= lessons.length) {
      this.showCompletionMessage();
      return;
    }

    const lesson = lessons[this.currentLesson];

    if (this.currentExercise >= lesson.exercises.length) {
      this.currentExercise = 0;
      this.currentLesson++;
      this.saveProgress();

      if (this.currentLesson >= lessons.length) {
        this.showCompletionMessage();
        return;
      }

      this.loadExercise();
      return;
    }

    this.currentText = lesson.exercises[this.currentExercise];
    this.currentCharIndex = 0;
    this.updateTextDisplay();
    this.updateCounters();
  }

  private completeExercise(): void {
    // Clear keyboard highlight
    if (this.currentHighlightedKey) {
      const prevKeyRect = this.keyboardKeys.get(this.currentHighlightedKey);
      if (prevKeyRect) {
        prevKeyRect.setFillStyle(0x34495e);
      }
      this.currentHighlightedKey = undefined;
    }

    // Show completion feedback
    if (this.textDisplayDOM) {
      this.textDisplayDOM.style.color = '#00b894';
    }

    // Move to next exercise after a short delay
    this.time.delayedCall(500, () => {
      if (this.textDisplayDOM) {
        this.textDisplayDOM.style.color = '#ecf0f1';
      }

      this.currentExercise++;
      this.saveProgress();
      this.loadExercise();
    });
  }

  private showCompletionMessage(): void {
    // Clear keyboard highlight
    if (this.currentHighlightedKey) {
      const prevKeyRect = this.keyboardKeys.get(this.currentHighlightedKey);
      if (prevKeyRect) {
        prevKeyRect.setFillStyle(0x34495e);
      }
      this.currentHighlightedKey = undefined;
    }

    if (this.textDisplayDOM) {
      this.textDisplayDOM.innerHTML = '🎉 Grattis! Du har klarat alla lektioner! 🎉';
      this.textDisplayDOM.style.color = '#00b894';
      this.textDisplayDOM.style.fontSize = '24px';
    }

    if (this.instructionText) {
      this.instructionText.setText('Du kan börja om från början genom att ladda om sidan.');
    }
  }

  private updateCounters(): void {
    if (this.lessonText) {
      this.lessonText.setText(`Lektion: ${this.currentLesson + 1}/${lessons.length}`);
    }

    if (this.exerciseText && this.currentLesson < lessons.length) {
      const exerciseCount = lessons[this.currentLesson].exercises.length;
      this.exerciseText.setText(`Övning: ${this.currentExercise + 1}/${exerciseCount}`);
    }
  }

  private saveProgress(): void {
    const progress: ProgressData = {
      currentLesson: this.currentLesson,
      currentExercise: this.currentExercise
    };

    localStorage.setItem('tangent-progress', JSON.stringify(progress));

    // Also update window for external UI if needed
    if (window.updateProgress) {
      window.updateProgress(this.currentLesson + 1, this.currentExercise + 1);
    }
  }

  private loadProgress(): void {
    const savedProgress = localStorage.getItem('tangent-progress');

    if (savedProgress) {
      try {
        const progress: ProgressData = JSON.parse(savedProgress);
        this.currentLesson = progress.currentLesson;
        this.currentExercise = progress.currentExercise;
      } catch (error) {
        console.error('Failed to load progress:', error);
        this.resetProgress();
      }
    } else {
      this.resetProgress();
    }
  }

  private resetProgress(): void {
    this.currentLesson = 0;
    this.currentExercise = 0;
    this.saveProgress();
  }

  shutdown(): void {
    // Clean up DOM element when scene is shut down
    if (this.textDisplayDOM && this.textDisplayDOM.parentNode) {
      this.textDisplayDOM.parentNode.removeChild(this.textDisplayDOM);
    }
  }
}

// Extend Window interface for external functions
declare global {
  interface Window {
    updateProgress?: (lesson: number, exercise: number) => void;
  }
}
