import Phaser from 'phaser';
import {
  type FactStat,
  type PersistedState,
  loadState,
  saveState,
  selectNextFact,
  recordAttempt,
  masteredCount,
  isMastered,
  avgTimeMs,
  totalFacts,
  MAX_BOX,
  DEFAULT_MAX_FACTOR,
  DEFAULT_STORAGE_KEY,
} from './scheduler';

const CANVAS_WIDTH = 720;

export interface GangertabellenConfig {
  /** Phaser scene key — must be unique per game instance. */
  sceneKey?: string;
  /** Range of factors. 10 → 1×1..10×10. 5 → 1×1..5×5. */
  maxFactor?: number;
  /** localStorage namespace. Different keys give independent progress. */
  storageKey?: string;
  /** Title shown in the in-canvas header. */
  title?: string;
}

/**
 * Attempts longer than this are treated as "user walked away" and are not
 * recorded. Otherwise a single afk would poison the fact's average for good.
 */
const ABANDONED_THRESHOLD_MS = 30_000;

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

  protected readonly maxFactor: number;
  protected readonly storageKey: string;
  protected readonly title: string;

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

  // Bound handler so we can off() it on shutdown.
  private keyHandler?: (e: KeyboardEvent) => void;

  constructor(config: GangertabellenConfig = {}) {
    super({ key: config.sceneKey ?? 'GangertabellenGame' });
    this.maxFactor = config.maxFactor ?? DEFAULT_MAX_FACTOR;
    this.storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;
    this.title = config.title ?? '✖️ Gångertabellen';
  }

  create(): void {
    this.state = loadState(this.storageKey, this.maxFactor);

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
    // n×n grid of cells; we treat (a,b) and (b,a) as one fact internally but
    // render both halves so the table looks like the familiar multiplication
    // matrix. Cell size scales up for smaller factor ranges so the panel
    // occupies roughly the same screen real-estate.
    const n = this.maxFactor;
    const cellSize = n <= 5 ? 44 : n <= 7 ? 36 : 28;
    const gap = 2;
    const fontSize = n <= 5 ? '16px' : n <= 7 ? '14px' : '12px';
    const labelFontSize = n <= 5 ? '13px' : '11px';
    const startY = 95;
    // Center the grid in the right portion of the canvas (around x=570).
    const gridSpan = (n - 1) * (cellSize + gap);
    const startX = 570 - gridSpan / 2;

    // Header row (factor b labels)
    for (let b = 1; b <= n; b++) {
      this.add
        .text(startX + (b - 1) * (cellSize + gap), startY - 14, String(b), {
          fontSize: labelFontSize,
          color: '#7f8c8d',
        })
        .setOrigin(0.5);
    }
    // Header column (factor a labels)
    for (let a = 1; a <= n; a++) {
      this.add
        .text(startX - cellSize / 2 - 8, startY + (a - 1) * (cellSize + gap), String(a), {
          fontSize: labelFontSize,
          color: '#7f8c8d',
        })
        .setOrigin(0.5);
    }

    for (let a = 1; a <= n; a++) {
      for (let b = 1; b <= n; b++) {
        const x = startX + (b - 1) * (cellSize + gap);
        const y = startY + (a - 1) * (cellSize + gap);

        const rect = this.add.rectangle(x, y, cellSize, cellSize, 0x3a4750);
        rect.setStrokeStyle(1, 0x2d3436);
        const label = this.add
          .text(x, y, String(a * b), {
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
      .text(startX + gridSpan / 2, startY + gridSpan + cellSize / 2 + 14, 'Bemästringsnivå', {
        fontSize: '11px',
        color: '#7f8c8d',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);
  }

  private setupKeyboardInput(): void {
    this.keyHandler = (event: KeyboardEvent): void => {
      // Only intercept digit input. Let other keys through (e.g., Tab, F-keys).
      if (event.key.length !== 1 || event.key < '0' || event.key > '9') return;

      event.preventDefault();
      this.handleDigit(event.key);
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

    // Quick green flash on the answer
    this.answerText?.setColor('#27ae60');
    this.time.delayedCall(180, () => {
      this.answerText?.setColor('#f1c40f');
      this.nextQuestion();
      this.refreshHeatmap();
      this.refreshStats();
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

    this.expectedAnswer = String(fact.a * fact.b);
    this.typedAnswer = '';
    this.errorsThisAttempt = 0;
    this.questionStartMs = performance.now();

    this.questionText?.setText(`${this.displayA} × ${this.displayB} = ?`);
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
      `Bemästrade: ${mastered}/${totalFacts(this.maxFactor)}  |  totalt svar: ${totalAttempts}`
    );
  }

  private refreshHeatmap(): void {
    for (let a = 1; a <= this.maxFactor; a++) {
      for (let b = 1; b <= this.maxFactor; b++) {
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
          label.setText(fact.attempts === 0 ? `${a * b}` : this.cellLabelFor(fact));
        }
      }
    }
  }

  private cellLabelFor(fact: FactStat): string {
    // For seen facts the cell shows the avg response time in seconds (no unit
    // suffix — the column is uniformly times). Unseen facts show the product
    // so the table doubles as a reference.
    if (fact.attempts === 0) return String(fact.a * fact.b);
    const avg = avgTimeMs(fact);
    return (avg / 1000).toFixed(1);
  }

  private findFact(a: number, b: number): FactStat | undefined {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return this.state.facts.find((f) => f.a === lo && f.b === hi);
  }

  shutdown(): void {
    if (this.keyHandler) {
      this.input.keyboard?.off('keydown', this.keyHandler);
      this.keyHandler = undefined;
    }
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
