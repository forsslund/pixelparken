import Phaser from 'phaser';
import { saveScore, getHighScore } from '../../common/utils';

interface Baby {
  sprite: Phaser.Physics.Arcade.Sprite;
  state: 'falling' | 'bouncing' | 'saved';
}

export class BouncingBabiesGame extends Phaser.Scene {
  private score: number = 0;
  private lives: number = 3;
  private level: number = 1;
  private gameOver: boolean = false;

  // Game objects
  private building?: Phaser.GameObjects.Graphics;
  private ambulance?: Phaser.GameObjects.Graphics;
  private trampoline?: Phaser.Physics.Arcade.Sprite;
  private leftWorker?: Phaser.GameObjects.Graphics;
  private rightWorker?: Phaser.GameObjects.Graphics;

  // Collections
  private babies: Baby[] = [];
  private windows: { x: number; y: number }[] = [];

  // UI
  private scoreText?: Phaser.GameObjects.Text;
  private livesText?: Phaser.GameObjects.Text;
  private levelText?: Phaser.GameObjects.Text;
  private gameOverText?: Phaser.GameObjects.Text;
  private highScoreText?: Phaser.GameObjects.Text;

  // Timers
  private babySpawnTimer?: Phaser.Time.TimerEvent;

  // Input
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  // Constants
  private readonly TRAMPOLINE_SPEED = 300;
  private readonly BUILDING_X = 100;
  private readonly AMBULANCE_X = 700;
  private readonly FLOOR_Y = 550;
  private readonly BABY_SPAWN_DELAY = 3000; // milliseconds

  constructor() {
    super({ key: 'BouncingBabiesGame' });
  }

  preload(): void {
    // No external assets needed - we'll use graphics
  }

  create(): void {
    // Initialize game state
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.babies = [];

    // Create game objects
    this.createBuilding();
    this.createAmbulance();
    this.createTrampoline();
    this.createWorkers();
    this.createUI();
    this.createFloor();

    // Setup input
    this.cursors = this.input.keyboard?.createCursorKeys();

    // Start spawning babies
    this.startBabySpawning();

    // Setup collisions
    this.setupCollisions();
  }

  private createBuilding(): void {
    this.building = this.add.graphics();
    this.building.fillStyle(0x8B4513, 1); // Brown
    this.building.fillRect(this.BUILDING_X - 50, 100, 100, 400);

    // Create windows
    this.windows = [];
    const windowPositions = [
      { x: this.BUILDING_X, y: 150 },
      { x: this.BUILDING_X, y: 250 },
      { x: this.BUILDING_X, y: 350 },
      { x: this.BUILDING_X, y: 450 },
    ];

    windowPositions.forEach(pos => {
      this.windows.push(pos);
      this.building?.fillStyle(0xFFFFFF, 1); // White windows
      this.building?.fillRect(pos.x - 15, pos.y - 15, 30, 30);

      // Add flames
      this.building?.fillStyle(0xFF4500, 1); // Orange-red flames
      this.building?.fillRect(pos.x - 10, pos.y - 20, 20, 10);
    });
  }

  private createAmbulance(): void {
    this.ambulance = this.add.graphics();

    // Ambulance body
    this.ambulance.fillStyle(0xFFFFFF, 1); // White
    this.ambulance.fillRect(this.AMBULANCE_X - 40, this.FLOOR_Y - 60, 80, 50);

    // Red cross
    this.ambulance.fillStyle(0xFF0000, 1);
    this.ambulance.fillRect(this.AMBULANCE_X - 10, this.FLOOR_Y - 50, 20, 5);
    this.ambulance.fillRect(this.AMBULANCE_X - 2.5, this.FLOOR_Y - 57.5, 5, 20);

    // Wheels
    this.ambulance.fillStyle(0x000000, 1);
    this.ambulance.fillCircle(this.AMBULANCE_X - 25, this.FLOOR_Y - 10, 10);
    this.ambulance.fillCircle(this.AMBULANCE_X + 25, this.FLOOR_Y - 10, 10);
  }

  private createTrampoline(): void {
    // Create trampoline as a sprite with physics
    this.trampoline = this.physics.add.sprite(400, this.FLOOR_Y - 40, '');
    this.trampoline.setDisplaySize(80, 10);
    this.trampoline.setImmovable(true);
    this.trampoline.setCollideWorldBounds(true);

    // Disable gravity for the trampoline
    const body = this.trampoline.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setAllowGravity(false);
    }

    // Draw trampoline
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFF69B4, 1); // Pink
    graphics.fillRect(-40, -5, 80, 10);
    graphics.generateTexture('trampoline', 80, 10);
    graphics.destroy();

    this.trampoline.setTexture('trampoline');
  }

  private createWorkers(): void {
    const trampolineX = this.trampoline?.x || 400;
    const trampolineY = this.trampoline?.y || this.FLOOR_Y - 40;

    // Left worker
    this.leftWorker = this.add.graphics();
    this.leftWorker.fillStyle(0x0000FF, 1); // Blue uniform
    this.leftWorker.fillRect(trampolineX - 60, trampolineY - 30, 20, 40);
    this.leftWorker.fillStyle(0xFFDBAC, 1); // Skin tone
    this.leftWorker.fillCircle(trampolineX - 50, trampolineY - 40, 10);

    // Right worker
    this.rightWorker = this.add.graphics();
    this.rightWorker.fillStyle(0x0000FF, 1);
    this.rightWorker.fillRect(trampolineX + 40, trampolineY - 30, 20, 40);
    this.rightWorker.fillStyle(0xFFDBAC, 1);
    this.rightWorker.fillCircle(trampolineX + 50, trampolineY - 40, 10);
  }

  private createFloor(): void {
    const floor = this.add.graphics();
    floor.fillStyle(0x808080, 1); // Gray
    floor.fillRect(0, this.FLOOR_Y, 800, 50);
  }

  private createUI(): void {
    // Score
    this.scoreText = this.add.text(10, 10, 'Score: 0', {
      fontSize: '24px',
      color: '#000000',
      fontStyle: 'bold',
    });

    // Lives
    this.livesText = this.add.text(10, 40, '❤️ Lives: 3', {
      fontSize: '20px',
      color: '#FF0000',
      fontStyle: 'bold',
    });

    // Level
    this.levelText = this.add.text(10, 70, 'Level: 1', {
      fontSize: '20px',
      color: '#000000',
      fontStyle: 'bold',
    });

    // High score
    const highScore = getHighScore('bouncing-babies') || 0;
    this.highScoreText = this.add.text(400, 10, `High Score: ${highScore}`, {
      fontSize: '20px',
      color: '#000000',
      fontStyle: 'bold',
    });
    this.highScoreText.setOrigin(0.5, 0);
  }

  private setupCollisions(): void {
    // Collision handling is done manually in update() method
    // since we need to check each baby individually
  }

  private startBabySpawning(): void {
    const delay = Math.max(1000, this.BABY_SPAWN_DELAY - (this.level - 1) * 200);

    this.babySpawnTimer = this.time.addEvent({
      delay,
      callback: () => this.spawnBaby(),
      callbackScope: this,
      loop: true,
    });
  }

  private spawnBaby(): void {
    if (this.gameOver) {
      return;
    }

    // Pick a random window
    const window = Phaser.Utils.Array.GetRandom(this.windows);
    if (!window) {
      return;
    }

    // Create baby sprite
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFFDBAC, 1); // Skin tone
    graphics.fillCircle(10, 10, 10);
    graphics.fillStyle(0xFFFFFF, 1); // White diaper
    graphics.fillRect(5, 15, 10, 8);
    graphics.generateTexture('baby', 20, 25);
    graphics.destroy();

    const baby = this.physics.add.sprite(window.x, window.y, 'baby');
    baby.setVelocityX(Phaser.Math.Between(-50, 50));
    baby.setBounce(0.8, 0.8);
    baby.setCollideWorldBounds(true);

    this.babies.push({
      sprite: baby,
      state: 'falling',
    });
  }

  update(): void {
    if (this.gameOver) {
      return;
    }

    // Move trampoline
    this.handleInput();

    // Update workers position
    this.updateWorkers();

    // Check baby states
    this.updateBabies();
  }

  private handleInput(): void {
    if (!this.trampoline || !this.cursors) {
      return;
    }

    if (this.cursors.left?.isDown) {
      this.trampoline.setVelocityX(-this.TRAMPOLINE_SPEED);
    } else if (this.cursors.right?.isDown) {
      this.trampoline.setVelocityX(this.TRAMPOLINE_SPEED);
    } else {
      this.trampoline.setVelocityX(0);
    }
  }

  private updateWorkers(): void {
    if (!this.leftWorker || !this.rightWorker || !this.trampoline) {
      return;
    }

    const trampolineX = this.trampoline.x;
    const trampolineY = this.trampoline.y;

    // Clear and redraw workers
    this.leftWorker.clear();
    this.leftWorker.fillStyle(0x0000FF, 1);
    this.leftWorker.fillRect(trampolineX - 60, trampolineY - 30, 20, 40);
    this.leftWorker.fillStyle(0xFFDBAC, 1);
    this.leftWorker.fillCircle(trampolineX - 50, trampolineY - 40, 10);

    this.rightWorker.clear();
    this.rightWorker.fillStyle(0x0000FF, 1);
    this.rightWorker.fillRect(trampolineX + 40, trampolineY - 30, 20, 40);
    this.rightWorker.fillStyle(0xFFDBAC, 1);
    this.rightWorker.fillCircle(trampolineX + 50, trampolineY - 40, 10);
  }

  private updateBabies(): void {
    if (!this.trampoline) {
      return;
    }

    for (let i = this.babies.length - 1; i >= 0; i--) {
      const baby = this.babies[i];
      const sprite = baby.sprite;

      if (!sprite || !sprite.body) {
        continue;
      }

      // Check if baby hit the trampoline
      if (
        baby.state === 'falling' &&
        this.physics.overlap(sprite, this.trampoline)
      ) {
        // Bounce baby towards ambulance
        baby.state = 'bouncing';
        sprite.setVelocityY(-400);
        sprite.setVelocityX(200);
      }

      // Check if baby reached ambulance
      if (
        baby.state === 'bouncing' &&
        sprite.x >= this.AMBULANCE_X - 40 &&
        sprite.x <= this.AMBULANCE_X + 40
      ) {
        baby.state = 'saved';
        sprite.destroy();
        this.babies.splice(i, 1);
        this.addScore(100);
        continue;
      }

      // Check if baby hit the ground
      if (sprite.y >= this.FLOOR_Y - 20 && baby.state === 'falling') {
        sprite.destroy();
        this.babies.splice(i, 1);
        this.loseLife();
      }

      // Remove babies that went off screen
      if (sprite.x > 850 || sprite.x < -50) {
        sprite.destroy();
        this.babies.splice(i, 1);
      }
    }
  }

  private addScore(points: number): void {
    this.score += points;
    this.scoreText?.setText(`Score: ${this.score}`);

    // Update DOM score
    if (window.updateScore) {
      window.updateScore(this.score);
    }

    // Level up every 500 points
    const newLevel = Math.floor(this.score / 500) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.levelText?.setText(`Level: ${this.level}`);
      this.restartBabySpawning();
    }
  }

  private loseLife(): void {
    this.lives--;
    this.livesText?.setText(`❤️ Lives: ${this.lives}`);

    if (this.lives <= 0) {
      this.endGame();
    }
  }

  private restartBabySpawning(): void {
    this.babySpawnTimer?.remove();
    this.startBabySpawning();
  }

  private endGame(): void {
    this.gameOver = true;

    // Stop spawning
    this.babySpawnTimer?.remove();

    // Destroy remaining babies
    this.babies.forEach(baby => baby.sprite?.destroy());
    this.babies = [];

    // Save high score
    const highScore = getHighScore('bouncing-babies');
    if (highScore === null || this.score > highScore) {
      saveScore('bouncing-babies', this.score);
    }

    // Show game over text
    this.gameOverText = this.add.text(400, 250, 'GAME OVER', {
      fontSize: '64px',
      color: '#FF0000',
      fontStyle: 'bold',
    });
    this.gameOverText.setOrigin(0.5);

    const finalScoreText = this.add.text(400, 320, `Final Score: ${this.score}`, {
      fontSize: '32px',
      color: '#000000',
      fontStyle: 'bold',
    });
    finalScoreText.setOrigin(0.5);

    const restartText = this.add.text(400, 380, 'Press SPACE to restart', {
      fontSize: '24px',
      color: '#000000',
    });
    restartText.setOrigin(0.5);

    // Add restart functionality
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.restart();
    });
  }

  shutdown(): void {
    // Clean up
    this.babySpawnTimer?.remove();
    this.babies.forEach(baby => baby.sprite?.destroy());
    this.babies = [];

    if (this.cursors) {
      this.input.keyboard?.removeAllKeys();
    }
  }
}
