import Phaser from 'phaser';
import { saveScore, getHighScore } from '../../common/utils';

// Tetromino shapes - each shape is a 4x4 matrix
const TETROMINOS = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: 0x47C5FF, // Aqua
  },
  O: {
    shape: [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    color: 0xFFD93A, // Yellow
  },
  T: {
    shape: [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    color: 0xFF7DD1, // Pink
  },
  S: {
    shape: [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    color: 0x74D680, // Green
  },
  Z: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    color: 0xFF6B6B, // Red
  },
  J: {
    shape: [
      [0, 0, 0, 0],
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    color: 0x3A78FF, // Blue
  },
  L: {
    shape: [
      [0, 0, 0, 0],
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    color: 0xFFA500, // Orange
  },
};

type TetrominoType = keyof typeof TETROMINOS;

interface Piece {
  shape: number[][];
  color: number;
  x: number;
  y: number;
  type: TetrominoType;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 24;

export class TetrisGame extends Phaser.Scene {
  private board: number[][] = [];
  private currentPiece?: Piece;
  private nextPiece?: Piece;
  private score: number = 0;
  private level: number = 1;
  private lines: number = 0;
  private gameOver: boolean = false;

  private boardGraphics?: Phaser.GameObjects.Graphics;
  private nextPieceGraphics?: Phaser.GameObjects.Graphics;
  private scoreText?: Phaser.GameObjects.Text;
  private levelText?: Phaser.GameObjects.Text;
  private linesText?: Phaser.GameObjects.Text;

  private dropTimer?: Phaser.Time.TimerEvent;
  private moveRepeatTimer?: Phaser.Time.TimerEvent;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey?: Phaser.Input.Keyboard.Key;

  private boardOffsetX: number = 0;
  private boardOffsetY: number = 0;

  private lastMoveTime: number = 0;
  private moveDelay: number = 100; // ms between repeated moves
  private isMovingLeft: boolean = false;
  private isMovingRight: boolean = false;
  private isMovingDown: boolean = false;

  constructor() {
    super({ key: 'TetrisGame' });
  }

  create(): void {
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;

    // Initialize board
    this.board = Array.from({ length: BOARD_HEIGHT }, () =>
      Array(BOARD_WIDTH).fill(0) as number[]
    );

    // Calculate board position (centered)
    this.boardOffsetX = 280;
    this.boardOffsetY = 60;

    // Create UI
    this.createUI();

    // Setup input
    this.setupInput();

    // Start game
    this.spawnPiece();
    this.startDropTimer();
  }

  private createUI(): void {
    // Title
    this.add.text(400, 20, 'TETRIS', {
      fontSize: '32px',
      color: '#FFFFFF',
      fontFamily: 'Fredoka One',
    }).setOrigin(0.5);

    // Board background
    const boardBg = this.add.rectangle(
      this.boardOffsetX,
      this.boardOffsetY,
      BOARD_WIDTH * BLOCK_SIZE,
      BOARD_HEIGHT * BLOCK_SIZE,
      0x1A1A1A,
      0.3
    );
    boardBg.setOrigin(0, 0);
    boardBg.setStrokeStyle(3, 0xFFFFFF, 0.5);

    // Board graphics
    this.boardGraphics = this.add.graphics();

    // Stats panel (right side)
    const panelX = 540;
    let panelY = 80;

    // Score
    this.add.text(panelX, panelY, 'POÄNG', {
      fontSize: '20px',
      color: '#FFFFFF',
      fontFamily: 'Fredoka One',
    });
    this.scoreText = this.add.text(panelX, panelY + 30, '0', {
      fontSize: '28px',
      color: '#FFD93A',
      fontFamily: 'Nunito',
      fontStyle: 'bold',
    });

    panelY += 100;

    // Level
    this.add.text(panelX, panelY, 'NIVÅ', {
      fontSize: '20px',
      color: '#FFFFFF',
      fontFamily: 'Fredoka One',
    });
    this.levelText = this.add.text(panelX, panelY + 30, '1', {
      fontSize: '28px',
      color: '#74D680',
      fontFamily: 'Nunito',
      fontStyle: 'bold',
    });

    panelY += 100;

    // Lines
    this.add.text(panelX, panelY, 'RADER', {
      fontSize: '20px',
      color: '#FFFFFF',
      fontFamily: 'Fredoka One',
    });
    this.linesText = this.add.text(panelX, panelY + 30, '0', {
      fontSize: '28px',
      color: '#47C5FF',
      fontFamily: 'Nunito',
      fontStyle: 'bold',
    });

    panelY += 100;

    // Next piece preview
    this.add.text(panelX, panelY, 'NÄSTA', {
      fontSize: '20px',
      color: '#FFFFFF',
      fontFamily: 'Fredoka One',
    });

    const previewBg = this.add.rectangle(
      panelX,
      panelY + 40,
      100,
      100,
      0x1A1A1A,
      0.3
    );
    previewBg.setOrigin(0, 0);
    previewBg.setStrokeStyle(2, 0xFFFFFF, 0.5);

    this.nextPieceGraphics = this.add.graphics();

    // Controls info (left side)
    const controlsX = 40;
    let controlsY = 80;

    this.add.text(controlsX, controlsY, 'KONTROLLER', {
      fontSize: '18px',
      color: '#FFFFFF',
      fontFamily: 'Fredoka One',
    });

    const controls = [
      '← → Flytta',
      '↓ Snabbare',
      '↑ Rotera',
      'Space Släpp',
    ];

    controlsY += 40;
    controls.forEach((text) => {
      this.add.text(controlsX, controlsY, text, {
        fontSize: '14px',
        color: '#FFFFFF',
        fontFamily: 'Nunito',
      });
      controlsY += 25;
    });

    // High score
    const highScore = getHighScore('tetris');
    if (highScore !== null) {
      this.add.text(controlsX, 500, `REKORD: ${highScore}`, {
        fontSize: '16px',
        color: '#FFD93A',
        fontFamily: 'Nunito',
        fontStyle: 'bold',
      });
    }
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Key down events for rotation and hard drop
    this.spaceKey?.on('down', () => {
      if (!this.gameOver) {
        this.hardDrop();
      }
    });

    this.cursors?.up.on('down', () => {
      if (!this.gameOver && this.currentPiece) {
        this.rotatePiece();
      }
    });

    // Track key states for continuous movement
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.gameOver) return;

      if (event.key === 'ArrowLeft') {
        this.isMovingLeft = true;
        this.movePiece(-1, 0);
        this.lastMoveTime = this.time.now;
      } else if (event.key === 'ArrowRight') {
        this.isMovingRight = true;
        this.movePiece(1, 0);
        this.lastMoveTime = this.time.now;
      } else if (event.key === 'ArrowDown') {
        this.isMovingDown = true;
        this.lastMoveTime = this.time.now;
      }
    });

    this.input.keyboard?.on('keyup', (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        this.isMovingLeft = false;
      } else if (event.key === 'ArrowRight') {
        this.isMovingRight = false;
      } else if (event.key === 'ArrowDown') {
        this.isMovingDown = false;
      }
    });
  }

  private spawnPiece(): void {
    // Use next piece or create a new one
    if (this.nextPiece) {
      this.currentPiece = this.nextPiece;
      this.currentPiece.x = Math.floor(BOARD_WIDTH / 2) - 2;
      this.currentPiece.y = 0;
    } else {
      this.currentPiece = this.createRandomPiece();
    }

    // Generate next piece
    this.nextPiece = this.createRandomPiece();
    this.drawNextPiece();

    // Check if game over (piece can't spawn)
    if (this.checkCollision(this.currentPiece, 0, 0)) {
      this.endGame();
    }
  }

  private createRandomPiece(): Piece {
    const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const type = Phaser.Utils.Array.GetRandom(types);
    const template = TETROMINOS[type];

    return {
      shape: template.shape.map(row => [...row]),
      color: template.color,
      x: Math.floor(BOARD_WIDTH / 2) - 2,
      y: 0,
      type,
    };
  }

  private startDropTimer(): void {
    const dropSpeed = Math.max(100, 1000 - (this.level - 1) * 100);

    this.dropTimer?.remove();
    this.dropTimer = this.time.addEvent({
      delay: dropSpeed,
      callback: () => {
        if (!this.gameOver) {
          this.dropPiece();
        }
      },
      loop: true,
    });
  }

  private dropPiece(): void {
    if (!this.currentPiece) return;

    if (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
    } else {
      this.lockPiece();
    }
  }

  private movePiece(dx: number, dy: number): void {
    if (!this.currentPiece || this.gameOver) return;

    if (!this.checkCollision(this.currentPiece, dx, dy)) {
      this.currentPiece.x += dx;
      this.currentPiece.y += dy;
    }
  }

  private rotatePiece(): void {
    if (!this.currentPiece || this.gameOver) return;

    // Don't rotate O piece (it's symmetrical)
    if (this.currentPiece.type === 'O') return;

    // Store original shape
    const original = this.currentPiece.shape;
    const piece = this.currentPiece;

    // Rotate 90 degrees clockwise
    const rotated = piece.shape[0].map((_, i) =>
      piece.shape.map(row => row[i]).reverse()
    );

    this.currentPiece.shape = rotated;

    // Try to place rotated piece with wall kicks
    let placed = false;
    const kicks = [0, 1, -1, 2, -2];

    for (const kick of kicks) {
      if (!this.checkCollision(this.currentPiece, kick, 0)) {
        this.currentPiece.x += kick;
        placed = true;
        break;
      }
    }

    // If couldn't place, revert rotation
    if (!placed) {
      this.currentPiece.shape = original;
    }
  }

  private hardDrop(): void {
    if (!this.currentPiece || this.gameOver) return;

    let dropDistance = 0;
    while (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      dropDistance++;
    }

    // Bonus points for hard drop
    this.score += dropDistance * 2;
    this.updateScoreDisplay();

    this.lockPiece();
  }

  private checkCollision(piece: Piece, dx: number, dy: number): boolean {
    const newX = piece.x + dx;
    const newY = piece.y + dy;

    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const boardX = newX + col;
          const boardY = newY + row;

          // Check boundaries
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
            return true;
          }

          // Check board collision (only if not above board)
          if (boardY >= 0 && this.board[boardY][boardX]) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private lockPiece(): void {
    if (!this.currentPiece) return;

    // Add piece to board
    for (let row = 0; row < this.currentPiece.shape.length; row++) {
      for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
        if (this.currentPiece.shape[row][col]) {
          const boardY = this.currentPiece.y + row;
          const boardX = this.currentPiece.x + col;

          if (boardY >= 0) {
            this.board[boardY][boardX] = this.currentPiece.color;
          }
        }
      }
    }

    // Check for completed lines
    this.clearLines();

    // Spawn next piece
    this.spawnPiece();
  }

  private clearLines(): void {
    let linesCleared = 0;

    for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
      if (this.board[row].every(cell => cell !== 0)) {
        // Remove line
        this.board.splice(row, 1);
        // Add new empty line at top
        this.board.unshift(Array(BOARD_WIDTH).fill(0) as number[]);
        linesCleared++;
        row++; // Check same row again
      }
    }

    if (linesCleared > 0) {
      // Update stats
      this.lines += linesCleared;

      // Score based on lines cleared (Tetris scoring)
      const lineScore = [0, 100, 300, 500, 800];
      this.score += lineScore[linesCleared] * this.level;

      // Level up every 10 lines
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.levelText?.setText(this.level.toString());
        this.startDropTimer(); // Increase speed
      }

      this.linesText?.setText(this.lines.toString());
      this.updateScoreDisplay();

      // Save high score
      saveScore('tetris', this.score);
    }
  }

  private endGame(): void {
    this.gameOver = true;
    this.dropTimer?.remove();

    // Game over overlay
    const overlay = this.add.rectangle(
      400,
      300,
      800,
      600,
      0x000000,
      0.7
    );
    overlay.setOrigin(0.5);

    this.add.text(400, 250, 'GAME OVER', {
      fontSize: '48px',
      color: '#FF7DD1',
      fontFamily: 'Fredoka One',
    }).setOrigin(0.5);

    this.add.text(400, 320, `Poäng: ${this.score}`, {
      fontSize: '32px',
      color: '#FFFFFF',
      fontFamily: 'Nunito',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const highScore = getHighScore('tetris');
    if (highScore && this.score >= highScore) {
      this.add.text(400, 360, '🎉 NYTT REKORD!', {
        fontSize: '24px',
        color: '#FFD93A',
        fontFamily: 'Nunito',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // Restart button
    const restartBtn = this.add.text(400, 420, 'SPELA IGEN', {
      fontSize: '24px',
      color: '#FFFFFF',
      fontFamily: 'Nunito',
      fontStyle: 'bold',
      backgroundColor: '#3A78FF',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);

    restartBtn.setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => {
      this.scene.restart();
    });

    restartBtn.on('pointerover', () => {
      restartBtn.setScale(1.1);
    });

    restartBtn.on('pointerout', () => {
      restartBtn.setScale(1);
    });
  }

  private updateScoreDisplay(): void {
    this.scoreText?.setText(this.score.toString());

    if (window.updateScore) {
      window.updateScore(this.score);
    }
  }

  private drawBoard(): void {
    if (!this.boardGraphics) return;

    this.boardGraphics.clear();

    // Draw locked pieces
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      for (let col = 0; col < BOARD_WIDTH; col++) {
        if (this.board[row][col]) {
          this.drawBlock(
            this.boardGraphics,
            this.boardOffsetX + col * BLOCK_SIZE,
            this.boardOffsetY + row * BLOCK_SIZE,
            this.board[row][col]
          );
        }
      }
    }

    // Draw current piece
    if (this.currentPiece) {
      for (let row = 0; row < this.currentPiece.shape.length; row++) {
        for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
          if (this.currentPiece.shape[row][col]) {
            const x = this.boardOffsetX + (this.currentPiece.x + col) * BLOCK_SIZE;
            const y = this.boardOffsetY + (this.currentPiece.y + row) * BLOCK_SIZE;
            this.drawBlock(this.boardGraphics, x, y, this.currentPiece.color);
          }
        }
      }

      // Draw ghost piece (preview where piece will land)
      this.drawGhostPiece();
    }

    // Draw grid lines
    this.boardGraphics.lineStyle(1, 0xFFFFFF, 0.1);
    for (let row = 0; row <= BOARD_HEIGHT; row++) {
      this.boardGraphics.lineBetween(
        this.boardOffsetX,
        this.boardOffsetY + row * BLOCK_SIZE,
        this.boardOffsetX + BOARD_WIDTH * BLOCK_SIZE,
        this.boardOffsetY + row * BLOCK_SIZE
      );
    }
    for (let col = 0; col <= BOARD_WIDTH; col++) {
      this.boardGraphics.lineBetween(
        this.boardOffsetX + col * BLOCK_SIZE,
        this.boardOffsetY,
        this.boardOffsetX + col * BLOCK_SIZE,
        this.boardOffsetY + BOARD_HEIGHT * BLOCK_SIZE
      );
    }
  }

  private drawGhostPiece(): void {
    if (!this.currentPiece || !this.boardGraphics) return;

    // Calculate ghost position
    let ghostY = this.currentPiece.y;
    while (!this.checkCollision(
      { ...this.currentPiece, y: ghostY + 1 },
      0,
      0
    )) {
      ghostY++;
    }

    // Draw ghost blocks
    for (let row = 0; row < this.currentPiece.shape.length; row++) {
      for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
        if (this.currentPiece.shape[row][col]) {
          const x = this.boardOffsetX + (this.currentPiece.x + col) * BLOCK_SIZE;
          const y = this.boardOffsetY + (ghostY + row) * BLOCK_SIZE;

          this.boardGraphics.lineStyle(2, this.currentPiece.color, 0.3);
          this.boardGraphics.strokeRect(
            x + 2,
            y + 2,
            BLOCK_SIZE - 4,
            BLOCK_SIZE - 4
          );
        }
      }
    }
  }

  private drawBlock(graphics: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
    // Main block
    graphics.fillStyle(color, 1);
    graphics.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

    // Highlight for 3D effect
    graphics.fillStyle(0xFFFFFF, 0.3);
    graphics.fillRect(x + 2, y + 2, BLOCK_SIZE - 4, 4);
    graphics.fillRect(x + 2, y + 2, 4, BLOCK_SIZE - 4);

    // Shadow for 3D effect
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillRect(x + 2, y + BLOCK_SIZE - 6, BLOCK_SIZE - 4, 4);
    graphics.fillRect(x + BLOCK_SIZE - 6, y + 2, 4, BLOCK_SIZE - 4);
  }

  private drawNextPiece(): void {
    if (!this.nextPieceGraphics || !this.nextPiece) return;

    this.nextPieceGraphics.clear();

    const previewX = 565;
    const previewY = 365;
    const smallBlockSize = 20;

    for (let row = 0; row < this.nextPiece.shape.length; row++) {
      for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
        if (this.nextPiece.shape[row][col]) {
          const x = previewX + col * smallBlockSize;
          const y = previewY + row * smallBlockSize;
          this.drawBlock(this.nextPieceGraphics, x, y, this.nextPiece.color);
        }
      }
    }
  }

  update(time: number): void {
    if (this.gameOver) return;

    // Handle continuous movement
    if (time - this.lastMoveTime > this.moveDelay) {
      if (this.isMovingLeft) {
        this.movePiece(-1, 0);
        this.lastMoveTime = time;
      } else if (this.isMovingRight) {
        this.movePiece(1, 0);
        this.lastMoveTime = time;
      }

      if (this.isMovingDown) {
        this.dropPiece();
        this.lastMoveTime = time;
      }
    }

    // Redraw board every frame
    this.drawBoard();
  }

  shutdown(): void {
    this.dropTimer?.remove();
    this.moveRepeatTimer?.remove();
    this.input.keyboard?.removeAllListeners();
  }
}
