import Phaser from 'phaser';
import { lessons } from './lessons';

interface KeyDef {
  label: string;
  code: string;
  col: number;
  row: number;
  wSpan?: number;
  hSpan?: number;
}

/**
 * Numpad layout mimicking a standard numeric keypad.
 * Each entry is positioned in a 4-column, 5-row grid.
 */
const NUMPAD_LAYOUT: KeyDef[] = [
  { label: 'Num', code: 'NumLock', col: 0, row: 0 },
  { label: '/', code: 'NumpadDivide', col: 1, row: 0 },
  { label: '*', code: 'NumpadMultiply', col: 2, row: 0 },
  { label: '-', code: 'NumpadSubtract', col: 3, row: 0 },
  { label: '7', code: 'Numpad7', col: 0, row: 1 },
  { label: '8', code: 'Numpad8', col: 1, row: 1 },
  { label: '9', code: 'Numpad9', col: 2, row: 1 },
  { label: '+', code: 'NumpadAdd', col: 3, row: 1, hSpan: 2 },
  { label: '4', code: 'Numpad4', col: 0, row: 2 },
  { label: '5', code: 'Numpad5', col: 1, row: 2 },
  { label: '6', code: 'Numpad6', col: 2, row: 2 },
  { label: '1', code: 'Numpad1', col: 0, row: 3 },
  { label: '2', code: 'Numpad2', col: 1, row: 3 },
  { label: '3', code: 'Numpad3', col: 2, row: 3 },
  { label: 'Enter', code: 'NumpadEnter', col: 3, row: 3, hSpan: 2 },
  { label: '0', code: 'Numpad0', col: 0, row: 4, wSpan: 2 },
  { label: '.', code: 'NumpadDecimal', col: 2, row: 4 },
];

/**
 * Maps each character used in exercises to the keyboard `event.code` value
 * for the corresponding numpad key. Used to highlight the visualization.
 */
const CHAR_TO_CODE: Record<string, string> = {
  '0': 'Numpad0',
  '1': 'Numpad1',
  '2': 'Numpad2',
  '3': 'Numpad3',
  '4': 'Numpad4',
  '5': 'Numpad5',
  '6': 'Numpad6',
  '7': 'Numpad7',
  '8': 'Numpad8',
  '9': 'Numpad9',
  '.': 'NumpadDecimal',
  '+': 'NumpadAdd',
  '-': 'NumpadSubtract',
  '*': 'NumpadMultiply',
  '/': 'NumpadDivide',
  '\n': 'NumpadEnter',
};

/**
 * Letter shortcuts for keyboards without a numpad. Mirrors the right hand's
 * home/upper rows onto the numpad. Works regardless of NumLock state.
 */
const LETTER_TO_CHAR: Record<string, string> = {
  'j': '1', 'k': '2', 'l': '3',
  'u': '4', 'i': '5', 'o': '6',
  'm': '0',
  'p': '+',
  'ö': '\n',
};

interface ProgressData {
  currentLesson: number;
  currentExercise: number;
}

export class NumpadGame extends Phaser.Scene {
  private currentLesson = 0;
  private currentExercise = 0;
  private currentText = '';
  private currentCharIndex = 0;

  private textDisplayDOM?: HTMLDivElement;
  private lessonText?: Phaser.GameObjects.Text;
  private exerciseText?: Phaser.GameObjects.Text;
  private instructionText?: Phaser.GameObjects.Text;

  private keyboardKeys: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private keyboardLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private currentHighlightedCode?: string;

  private keyHandler?: (event: KeyboardEvent) => void;

  constructor() {
    super({ key: 'NumpadGame' });
  }

  create(): void {
    this.loadProgress();

    this.cameras.main.setBackgroundColor('#2d3436');

    this.createHeader();
    this.createInstructions();
    this.createTextDisplay();
    this.createKeyboard();

    this.setupKeyboardInput();

    this.loadExercise();
  }

  private createHeader(): void {
    const headerBg = this.add.rectangle(360, 40, 680, 60, 0x34495e);
    headerBg.setStrokeStyle(2, 0x7f8c8d);

    this.add.text(360, 30, '🔢 Numpadträning', {
      fontSize: '24px',
      color: '#ecf0f1',
      fontStyle: 'bold'
    }).setOrigin(0.5);

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
    this.instructionText = this.add.text(360, 100, 'Skriv siffrorna med numpaden. Saknar du numpad? jkl=123 osv.', {
      fontSize: '14px',
      color: '#95a5a6',
      wordWrap: { width: 630 }
    }).setOrigin(0.5);
  }

  private createTextDisplay(): void {
    this.textDisplayDOM = document.createElement('div');
    this.textDisplayDOM.style.position = 'absolute';
    this.textDisplayDOM.style.left = '50%';
    this.textDisplayDOM.style.top = '244px';
    this.textDisplayDOM.style.transform = 'translateX(-50%)';
    this.textDisplayDOM.style.width = '100%';
    this.textDisplayDOM.style.maxWidth = '100%';
    this.textDisplayDOM.style.fontSize = '22px';
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
    const keyWidth = 64;
    const keyHeight = 52;
    const spacing = 4;
    const totalWidth = keyWidth * 4 + spacing * 3;
    const startX = 360 - totalWidth / 2;
    const startY = 188;

    NUMPAD_LAYOUT.forEach((def) => {
      const wSpan = def.wSpan ?? 1;
      const hSpan = def.hSpan ?? 1;
      const width = keyWidth * wSpan + spacing * (wSpan - 1);
      const height = keyHeight * hSpan + spacing * (hSpan - 1);
      const x = startX + def.col * (keyWidth + spacing) + width / 2;
      const y = startY + def.row * (keyHeight + spacing) + height / 2;

      const keyRect = this.add.rectangle(x, y, width, height, 0x34495e);
      keyRect.setStrokeStyle(2, 0x7f8c8d);

      const fontSize = def.label.length > 1 ? '14px' : '20px';
      const keyLabel = this.add.text(x, y, def.label, {
        fontSize,
        color: '#ecf0f1',
        fontFamily: 'Arial'
      }).setOrigin(0.5);

      this.keyboardKeys.set(def.code, keyRect);
      this.keyboardLabels.set(def.code, keyLabel);
    });

    const lastY = startY + 5 * (keyHeight + spacing);
    this.add.text(360, lastY + 8, 'Genvägar: jkl=123, uio=456, m=0, p=+, ö=Enter. 7-9 även från sifferraden.', {
      fontSize: '12px',
      color: '#7f8c8d',
      fontStyle: 'italic'
    }).setOrigin(0.5);
  }

  private setupKeyboardInput(): void {
    this.keyHandler = (event: KeyboardEvent) => {
      event.preventDefault();

      if (event.code === 'Backspace') {
        return;
      }

      const expectedChar = this.currentText[this.currentCharIndex];
      if (expectedChar === undefined) return;

      const expectedCode = CHAR_TO_CODE[expectedChar];

      if (this.eventMatchesChar(event, expectedChar)) {
        if (expectedCode) {
          this.flashKey(expectedCode, 0x00b894);
        }
        this.currentCharIndex++;
        this.advancePastSpaces();

        if (this.currentCharIndex >= this.currentText.length) {
          this.completeExercise();
        } else {
          this.updateTextDisplay();
        }
      } else {
        const flashCode = this.inferNumpadCode(event);
        if (flashCode) {
          this.flashKey(flashCode, 0xd63031);
        }
      }
    };

    this.input.keyboard?.on('keydown', this.keyHandler);
  }

  private eventMatchesChar(event: KeyboardEvent, expectedChar: string): boolean {
    const expectedCode = CHAR_TO_CODE[expectedChar];
    if (expectedCode && event.code === expectedCode) return true;
    if (event.key === expectedChar) return true;
    if (expectedChar === '\n' && event.code === 'Enter') return true;
    const lower = event.key ? event.key.toLowerCase() : '';
    if (LETTER_TO_CHAR[lower] === expectedChar) return true;
    return false;
  }

  private advancePastSpaces(): void {
    while (
      this.currentCharIndex < this.currentText.length &&
      this.currentText[this.currentCharIndex] === ' '
    ) {
      this.currentCharIndex++;
    }
  }

  private inferNumpadCode(event: KeyboardEvent): string | undefined {
    if (this.keyboardKeys.has(event.code)) return event.code;
    if (event.key) {
      const direct = CHAR_TO_CODE[event.key];
      if (direct && this.keyboardKeys.has(direct)) return direct;
      const altChar = LETTER_TO_CHAR[event.key.toLowerCase()];
      if (altChar) {
        const code = CHAR_TO_CODE[altChar];
        if (code && this.keyboardKeys.has(code)) return code;
      }
    }
    return undefined;
  }

  private flashKey(code: string, color: number): void {
    const keyRect = this.keyboardKeys.get(code);
    if (!keyRect) return;

    keyRect.setFillStyle(color);
    this.time.delayedCall(200, () => {
      const isCurrentExpected = this.currentHighlightedCode === code;
      keyRect.setFillStyle(isCurrentExpected ? 0xf39c12 : 0x34495e);
    });
  }

  private highlightExpectedKey(): void {
    if (this.currentHighlightedCode) {
      const prev = this.keyboardKeys.get(this.currentHighlightedCode);
      if (prev) {
        prev.setFillStyle(0x34495e);
      }
      this.currentHighlightedCode = undefined;
    }

    if (this.currentCharIndex < this.currentText.length) {
      const expectedChar = this.currentText[this.currentCharIndex];
      const expectedCode = CHAR_TO_CODE[expectedChar];
      if (expectedCode) {
        const keyRect = this.keyboardKeys.get(expectedCode);
        if (keyRect) {
          keyRect.setFillStyle(0xf39c12);
          this.currentHighlightedCode = expectedCode;
        }
      }
    }
  }

  private updateTextDisplay(): void {
    if (!this.textDisplayDOM) return;

    let displayHTML = '';
    for (let i = 0; i < this.currentText.length; i++) {
      const char = this.currentText[i];

      if (char === ' ') {
        // Spaces aren't on the numpad — render a thin visual gap and skip them on input.
        displayHTML += '<span style="display:inline-block; width:10px;"></span>';
        continue;
      }

      if (i === this.currentCharIndex) {
        displayHTML += `<span style="background-color: #f1c40f; color: #000; padding: 2px 4px; border-radius: 3px; font-weight: bold;">${char}</span>`;
      } else if (i < this.currentCharIndex) {
        displayHTML += `<span style="color: #00b894;">${char}</span>`;
      } else {
        displayHTML += char;
      }
    }

    this.textDisplayDOM.innerHTML = displayHTML;
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
    this.advancePastSpaces();
    this.updateTextDisplay();
    this.updateCounters();
  }

  private completeExercise(): void {
    if (this.currentHighlightedCode) {
      const prev = this.keyboardKeys.get(this.currentHighlightedCode);
      if (prev) {
        prev.setFillStyle(0x34495e);
      }
      this.currentHighlightedCode = undefined;
    }

    if (this.textDisplayDOM) {
      this.textDisplayDOM.style.color = '#00b894';
    }

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
    if (this.currentHighlightedCode) {
      const prev = this.keyboardKeys.get(this.currentHighlightedCode);
      if (prev) {
        prev.setFillStyle(0x34495e);
      }
      this.currentHighlightedCode = undefined;
    }

    if (this.textDisplayDOM) {
      this.textDisplayDOM.innerHTML = '🎉 Grattis! Du har klarat alla numpad-lektioner! 🎉';
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

    localStorage.setItem('numpad-progress', JSON.stringify(progress));

    if (window.updateProgress) {
      window.updateProgress(this.currentLesson + 1, this.currentExercise + 1);
    }
  }

  private loadProgress(): void {
    const savedProgress = localStorage.getItem('numpad-progress');

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
    if (this.keyHandler) {
      this.input.keyboard?.off('keydown', this.keyHandler);
      this.keyHandler = undefined;
    }
    if (this.textDisplayDOM && this.textDisplayDOM.parentNode) {
      this.textDisplayDOM.parentNode.removeChild(this.textDisplayDOM);
    }
  }
}

declare global {
  interface Window {
    updateProgress?: (lesson: number, exercise: number) => void;
  }
}
