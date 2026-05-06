import Phaser from 'phaser';
import {
  type FactStat,
  type FactBuilder,
  type PersistedState,
  loadState,
  saveState,
  selectNextFact,
  recordAttempt,
  masteredCount,
  isMastered,
  avgTimeMs,
  makeAllFacts,
  MAX_BOX,
  DEFAULT_MAX_FACTOR,
  DEFAULT_STORAGE_KEY,
} from './scheduler';

const CANVAS_WIDTH = 720;

export type Operation = 'multiply' | 'add';

/**
 * Describes which cells of the matrix heatmap exist. Multiplication uses a
 * full square (1..n × 1..n). Addition uses a triangle (a+b ≤ maxSum).
 */
export interface GridLayout {
  rowMin: number;
  rowMax: number;
  colMin: number;
  colMax: number;
  cellExists: (a: number, b: number) => boolean;
}

export interface GangertabellenConfig {
  /** Phaser scene key — must be unique per game instance. */
  sceneKey?: string;
  /**
   * Convenience for multiplication mode: 10 → 1×1..10×10, 5 → 1×1..5×5.
   * Ignored if `factBuilder` or `gridLayout` is set explicitly.
   */
  maxFactor?: number;
  /** localStorage namespace. Different keys give independent progress. */
  storageKey?: string;
  /** Title shown in the in-canvas header. */
  title?: string;
  /** What math is being practiced. Default: 'multiply'. */
  operation?: Operation;
  /** Override the canonical fact set. */
  factBuilder?: FactBuilder;
  /** Override the heatmap matrix layout. */
  gridLayout?: GridLayout;
}

/**
 * Attempts longer than this are treated as "user walked away" and are not
 * recorded. Otherwise a single afk would poison the fact's average for good.
 */
const ABANDONED_THRESHOLD_MS = 30_000;

/**
 * Home-row "virtual numpad" mapping. Lets a player without a real numpad
 * type digits using the touch-typing right-hand position:
 *   u i o   →  4 5 6
 *   j k l   →  1 2 3
 *   m       →  0
 * Both the alphabetic key and the actual digit key are accepted.
 */
const KEY_TO_DIGIT: Record<string, string> = {
  m: '0',
  j: '1',
  k: '2',
  l: '3',
  u: '4',
  i: '5',
  o: '6',
};

/** Color for a fact cell in the heatmap, based on box level + activity. */
function heatColor(f: FactStat): number {
  if (f.attempts === 0) return 0x3a4750; // unseen — slate
  if (isMastered(f)) return 0x27ae60; // mastered — green

  const ratio = f.box / MAX_BOX; // 0..(MASTERY_BOX-1)/MAX_BOX
  // Interpolate red → yellow → light-green
  if (ratio < 0.5) {
    // red (0xd63031) → orange (0xe67e22)
    const t = ratio / 0.5;
    return lerpColor(0xd63031, 0xe67e22, t);
  } else {
    // orange (0xe67e22) → yellow-green (0xa3cb38)
    const t = (ratio - 0.5) / 0.5;
    return lerpColor(0xe67e22, 0xa3cb38, t);
  }
}

function lerpColor(c1: number, c2: number, t: number): number {
  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return (r << 16) | (g << 8) | b;
}

export class GangertabellenGame extends Phaser.Scene {
  private state: PersistedState = { version: 1, facts: [], sessionsCompleted: 0 };

  protected readonly storageKey: string;
  protected readonly title: string;
  protected readonly operation: Operation;
  protected readonly factBuilder: FactBuilder;
  protected readonly gridLayout: GridLayout;

  // Question state
  private currentFact?: FactStat;
  /** Display order — randomly swapped each question, so eleven sees both 4×3 and 3×4. */
  private displayA = 0;
  private displayB = 0;
  private expectedAnswer = '';
  private typedAnswer = '';
  private questionStartMs = 0;
  private errorsThisAttempt = 0;

  // Display objects
  private questionText?: Phaser.GameObjects.Text;
  private answerText?: Phaser.GameObjects.Text;
  private statsText?: Phaser.GameObjects.Text;
  private masteryText?: Phaser.GameObjects.Text;

  // Heatmap
  private heatmapCells: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private heatmapLabels: Map<string, Phaser.GameObjects.Text> = new Map();

  // Session totals
  private sessionAttempts = 0;
  private sessionErrors = 0;
  private sessionTotalMs = 0;

  // Mastery tracking — used to detect the moment the player completes the set.
  private prevMasteredCount = 0;
  private celebrating = false;
  private celebrationGroup?: Phaser.GameObjects.Container;

  // Bound handler so we can off() it on shutdown.
  private keyHandler?: (e: KeyboardEvent) => void;

  constructor(config: GangertabellenConfig = {}) {
    super({ key: config.sceneKey ?? 'GangertabellenGame' });
    const maxFactor = config.maxFactor ?? DEFAULT_MAX_FACTOR;
    this.storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;
    this.title = config.title ?? '✖️ Gångertabellen';
    this.operation = config.operation ?? 'multiply';
    this.factBuilder = config.factBuilder ?? ((): FactStat[] => makeAllFacts(maxFactor));
    this.gridLayout = config.gridLayout ?? {
      rowMin: 1,
      rowMax: maxFactor,
      colMin: 1,
      colMax: maxFactor,
      cellExists: (): boolean => true,
    };
  }

  /** Symbol shown in the question and used in the cell-label fallback. */
  protected get operationSymbol(): string {
    return this.operation === 'add' ? '+' : '×';
  }

  /** The arithmetic answer for a given fact, depending on the active operation. */
  protected computeAnswer(a: number, b: number): number {
    return this.operation === 'add' ? a + b : a * b;
  }

  create(): void {
    this.state = loadState(this.storageKey, this.factBuilder);
    this.prevMasteredCount = masteredCount(this.state.facts);

    this.cameras.main.setBackgroundColor('#2d3436');

    this.createHeader();
    this.createQuestionArea();
    this.createStatsArea();
    this.createHeatmap();
    this.setupKeyboardInput();

    this.nextQuestion();
    this.refreshHeatmap();
    this.refreshStats();
  }

  private createHeader(): void {
    const headerBg = this.add.rectangle(CANVAS_WIDTH / 2, 30, CANVAS_WIDTH - 40, 50, 0x34495e);
    headerBg.setStrokeStyle(2, 0x7f8c8d);

    this.add
      .text(CANVAS_WIDTH / 2, 30, this.title, {
        fontSize: '22px',
        color: '#ecf0f1',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private createQuestionArea(): void {
    const cx = 230;

    this.questionText = this.add
      .text(cx, 170, '', {
        fontSize: '72px',
        color: '#ecf0f1',
        fontStyle: 'bold',
        fontFamily: 'Consolas, Courier, monospace',
      })
      .setOrigin(0.5);

    this.answerText = this.add
      .text(cx, 270, '', {
        fontSize: '72px',
        color: '#f1c40f',
        fontStyle: 'bold',
        fontFamily: 'Consolas, Courier, monospace',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 350, 'Skriv svaret. Fel tangenter ignoreras.', {
        fontSize: '13px',
        color: '#7f8c8d',
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: 400 },
      })
      .setOrigin(0.5);
  }

  private createStatsArea(): void {
    const cx = 230;

    this.statsText = this.add
      .text(cx, 400, '', {
        fontSize: '14px',
        color: '#bdc3c7',
        align: 'center',
      })
      .setOrigin(0.5);

    this.masteryText = this.add
      .text(cx, 425, '', {
        fontSize: '14px',
        color: '#bdc3c7',
        align: 'center',
      })
      .setOrigin(0.5);
  }

  private createHeatmap(): void {
    // Render the heatmap as a row×col matrix according to gridLayout. Cells
    // where cellExists() returns false are skipped — that's how the addition
    // variant renders a triangular shape (a+b ≤ maxSum).
    const { rowMin, rowMax, colMin, colMax, cellExists } = this.gridLayout;
    const rows = rowMax - rowMin + 1;
    const cols = colMax - colMin + 1;
    const n = Math.max(rows, cols);

    const cellSize = n <= 5 ? 44 : n <= 7 ? 36 : n <= 9 ? 30 : n <= 10 ? 28 : 24;
    const gap = 2;
    const fontSize = n <= 5 ? '16px' : n <= 7 ? '14px' : n <= 10 ? '12px' : '10px';
    const labelFontSize = n <= 5 ? '13px' : '11px';
    const startY = 95;
    // Center the grid horizontally in the right portion of the canvas.
    const gridSpanX = (cols - 1) * (cellSize + gap);
    const startX = 570 - gridSpanX / 2;
    const gridSpanY = (rows - 1) * (cellSize + gap);

    // Header row (column labels: b)
    for (let b = colMin; b <= colMax; b++) {
      this.add
        .text(startX + (b - colMin) * (cellSize + gap), startY - 14, String(b), {
          fontSize: labelFontSize,
          color: '#7f8c8d',
        })
        .setOrigin(0.5);
    }
    // Header column (row labels: a)
    for (let a = rowMin; a <= rowMax; a++) {
      this.add
        .text(startX - cellSize / 2 - 8, startY + (a - rowMin) * (cellSize + gap), String(a), {
          fontSize: labelFontSize,
          color: '#7f8c8d',
        })
        .setOrigin(0.5);
    }

    for (let a = rowMin; a <= rowMax; a++) {
      for (let b = colMin; b <= colMax; b++) {
        if (!cellExists(a, b)) continue;
        const x = startX + (b - colMin) * (cellSize + gap);
        const y = startY + (a - rowMin) * (cellSize + gap);

        const rect = this.add.rectangle(x, y, cellSize, cellSize, 0x3a4750);
        rect.setStrokeStyle(1, 0x2d3436);
        const label = this.add
          .text(x, y, String(this.computeAnswer(a, b)), {
            fontSize,
            color: '#ecf0f1',
          })
          .setOrigin(0.5);

        this.heatmapCells.set(`${a},${b}`, rect);
        this.heatmapLabels.set(`${a},${b}`, label);
      }
    }

    // Legend
    this.add
      .text(startX + gridSpanX / 2, startY + gridSpanY + cellSize / 2 + 14, 'Bemästringsnivå', {
        fontSize: '11px',
        color: '#7f8c8d',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);
  }

  private setupKeyboardInput(): void {
    this.keyHandler = (event: KeyboardEvent): void => {
      // During the celebration overlay, any key dismisses it.
      if (this.celebrating) {
        event.preventDefault();
        this.dismissCelebration();
        return;
      }

      let digit: string | undefined;
      if (event.key.length === 1 && event.key >= '0' && event.key <= '9') {
        digit = event.key;
      } else {
        digit = KEY_TO_DIGIT[event.key.toLowerCase()];
      }

      if (digit === undefined) return;

      event.preventDefault();
      this.handleDigit(digit);
    };

    this.input.keyboard?.on('keydown', this.keyHandler);
  }

  private handleDigit(digit: string): void {
    if (!this.currentFact) return;

    const expectedNext = this.expectedAnswer[this.typedAnswer.length];
    if (digit === expectedNext) {
      this.typedAnswer += digit;
      this.refreshAnswerDisplay(false);

      if (this.typedAnswer === this.expectedAnswer) {
        this.completeQuestion();
      }
    } else {
      this.errorsThisAttempt++;
      this.flashWrong();
    }
  }

  private flashWrong(): void {
    if (!this.questionText) return;
    const original = this.questionText.x;
    this.questionText.setColor('#e74c3c');
    this.tweens.add({
      targets: this.questionText,
      x: { from: original - 6, to: original + 6 },
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.questionText?.setX(original);
        this.questionText?.setColor('#ecf0f1');
      },
    });
  }

  private completeQuestion(): void {
    if (!this.currentFact) return;

    const responseTimeMs = performance.now() - this.questionStartMs;

    if (responseTimeMs > ABANDONED_THRESHOLD_MS) {
      // Likely afk — discard the attempt entirely so the fact's average and
      // box level are not polluted. Just slide to the next question.
      this.nextQuestion();
      this.refreshHeatmap();
      return;
    }

    recordAttempt(this.currentFact, responseTimeMs, this.errorsThisAttempt, Date.now());

    this.sessionAttempts++;
    this.sessionErrors += this.errorsThisAttempt;
    this.sessionTotalMs += responseTimeMs;

    saveState(this.state, this.storageKey);

    // Detect the transition where the player just achieved full mastery.
    const newMastered = masteredCount(this.state.facts);
    const total = this.state.facts.length;
    const justCompleted = this.prevMasteredCount < total && newMastered === total;
    this.prevMasteredCount = newMastered;

    // Quick green flash on the answer
    this.answerText?.setColor('#27ae60');
    this.time.delayedCall(180, () => {
      this.answerText?.setColor('#f1c40f');
      this.refreshHeatmap();
      this.refreshStats();

      if (justCompleted) {
        this.showCelebration();
      } else {
        this.nextQuestion();
      }
    });
  }

  private nextQuestion(): void {
    const fact = selectNextFact(this.state.facts, Date.now());
    this.currentFact = fact;

    // Randomly swap display order for commutative variety.
    if (Math.random() < 0.5) {
      this.displayA = fact.a;
      this.displayB = fact.b;
    } else {
      this.displayA = fact.b;
      this.displayB = fact.a;
    }

    this.expectedAnswer = String(this.computeAnswer(fact.a, fact.b));
    this.typedAnswer = '';
    this.errorsThisAttempt = 0;
    this.questionStartMs = performance.now();

    this.questionText?.setText(
      `${this.displayA} ${this.operationSymbol} ${this.displayB} = ?`
    );
    this.refreshAnswerDisplay(true);
  }

  private refreshAnswerDisplay(reset: boolean): void {
    if (!this.answerText) return;
    if (reset || this.typedAnswer.length === 0) {
      // Show placeholder underscore(s)
      this.answerText.setText('_'.repeat(this.expectedAnswer.length));
      return;
    }
    const remaining = this.expectedAnswer.length - this.typedAnswer.length;
    this.answerText.setText(this.typedAnswer + '_'.repeat(remaining));
  }

  private refreshStats(): void {
    if (!this.statsText || !this.masteryText) return;

    const avg = this.sessionAttempts > 0 ? this.sessionTotalMs / this.sessionAttempts : 0;
    const avgStr = avg > 0 ? `${(avg / 1000).toFixed(2)}s` : '—';
    this.statsText.setText(
      `Session: ${this.sessionAttempts} svar  |  snitt ${avgStr}  |  fel ${this.sessionErrors}`
    );

    const mastered = masteredCount(this.state.facts);
    const totalAttempts = this.state.facts.reduce((s, f) => s + f.attempts, 0);
    this.masteryText.setText(
      `Bemästrade: ${mastered}/${this.state.facts.length}  |  totalt svar: ${totalAttempts}`
    );
  }

  private refreshHeatmap(): void {
    const { rowMin, rowMax, colMin, colMax, cellExists } = this.gridLayout;
    for (let a = rowMin; a <= rowMax; a++) {
      for (let b = colMin; b <= colMax; b++) {
        if (!cellExists(a, b)) continue;
        const fact = this.findFact(a, b);
        if (!fact) continue;

        const cell = this.heatmapCells.get(`${a},${b}`);
        const label = this.heatmapLabels.get(`${a},${b}`);
        if (!cell) continue;

        cell.setFillStyle(heatColor(fact));

        // Highlight the current fact's cells (both orientations).
        if (
          this.currentFact &&
          ((this.currentFact.a === a && this.currentFact.b === b) ||
            (this.currentFact.a === b && this.currentFact.b === a))
        ) {
          cell.setStrokeStyle(2, 0xf1c40f);
        } else {
          cell.setStrokeStyle(1, 0x2d3436);
        }

        // Make label readable on dark/light backgrounds.
        if (label) {
          const mastered = isMastered(fact);
          label.setColor(mastered || fact.attempts === 0 ? '#ecf0f1' : '#000000');
          label.setText(this.cellLabelFor(fact, a, b));
        }
      }
    }
  }

  private cellLabelFor(fact: FactStat, a: number, b: number): string {
    // For seen facts the cell shows the avg response time in seconds. Unseen
    // facts show the answer (product or sum) so the table doubles as a
    // reference.
    if (fact.attempts === 0) return String(this.computeAnswer(a, b));
    const avg = avgTimeMs(fact);
    return (avg / 1000).toFixed(1);
  }

  private findFact(a: number, b: number): FactStat | undefined {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return this.state.facts.find((f) => f.a === lo && f.b === hi);
  }

  private showCelebration(): void {
    this.celebrating = true;
    const total = this.state.facts.length;

    const overlay = this.add.rectangle(
      CANVAS_WIDTH / 2,
      247,
      CANVAS_WIDTH,
      495,
      0x000000,
      0.78
    );
    const title = this.add
      .text(CANVAS_WIDTH / 2, 170, '🎉 Grattis! 🎉', {
        fontSize: '52px',
        color: '#f1c40f',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const msg = this.add
      .text(CANVAS_WIDTH / 2, 240, `Alla ${total} fakta är bemästrade!`, {
        fontSize: '24px',
        color: '#ecf0f1',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const sub = this.add
      .text(
        CANVAS_WIDTH / 2,
        290,
        'Du har lärt dig hela tabellen — fantastiskt jobbat!',
        {
          fontSize: '16px',
          color: '#bdc3c7',
          fontStyle: 'italic',
        }
      )
      .setOrigin(0.5);
    const dismissHint = this.add
      .text(CANVAS_WIDTH / 2, 350, 'Tryck på valfri tangent för att fortsätta öva', {
        fontSize: '13px',
        color: '#7f8c8d',
      })
      .setOrigin(0.5);

    this.celebrationGroup = this.add.container(0, 0, [overlay, title, msg, sub, dismissHint]);

    this.tweens.add({
      targets: title,
      scale: { from: 0.7, to: 1.05 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private dismissCelebration(): void {
    if (!this.celebrating) return;
    this.celebrating = false;
    this.celebrationGroup?.destroy();
    this.celebrationGroup = undefined;
    this.nextQuestion();
  }

  shutdown(): void {
    if (this.keyHandler) {
      this.input.keyboard?.off('keydown', this.keyHandler);
      this.keyHandler = undefined;
    }
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.celebrationGroup?.destroy();
    this.celebrationGroup = undefined;
    this.celebrating = false;
  }
}
