import Phaser from 'phaser';

// Character abilities
type AbilityType = 'dig' | 'build' | 'climb' | 'block' | null;

// Brainrot character emojis
const BRAINROT_EMOJIS = ['🧠', '💀', '🤯', '😵', '🤡', '👾', '🥴', '😱'];

interface BrainrotCharacter {
  sprite: Phaser.Physics.Arcade.Sprite;
  text: Phaser.GameObjects.Text;
  ability: AbilityType;
  facing: 1 | -1; // 1 = right, -1 = left
  isAlive: boolean;
  canClimb: boolean;
  isDigging: boolean;
  isBlocking: boolean;
  isBuilding: boolean;
  buildCount: number; // Number of build steps used
  digCount: number; // Number of dig steps used
  emoji: string;
}

const MAX_BUILD_STEPS = 12;
const MAX_DIG_STEPS = 8;

export class BrainrotLemmings extends Phaser.Scene {
  private characters: BrainrotCharacter[] = [];
  private platforms?: Phaser.Physics.Arcade.StaticGroup;
  private buildPlatforms?: Phaser.Physics.Arcade.StaticGroup;
  private entrance?: Phaser.GameObjects.Rectangle;
  private exit?: Phaser.GameObjects.Rectangle;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private totalToSpawn = 20;
  private spawnCount = 0;
  private savedCount = 0;
  private lostCount = 0;
  private gameSpeed = 1;
  private isPaused = false;
  private gameEnded = false;

  constructor() {
    super('BrainrotLemmings');
  }

  create(): void {
    // Create level
    this.createLevel();

    // Set up character click handler
    this.input.on('gameobjectdown', this.onCharacterClick.bind(this));

    // Set up spawn timer
    this.spawnTimer = this.time.addEvent({
      delay: 2000,
      callback: this.spawnCharacter.bind(this),
      loop: true,
    });

    // Set up window functions for UI controls
    window.togglePause = () => this.togglePause();
    window.toggleSpeed = () => this.toggleSpeed();

    // Update initial stats
    this.updateStats();
  }

  private createLevel(): void {
    // Create platform group
    this.platforms = this.physics.add.staticGroup();
    this.buildPlatforms = this.physics.add.staticGroup();

    // Ground
    const ground = this.add.rectangle(600, 680, 1200, 40, 0x4a4a4a);
    this.platforms.add(ground);

    // Platforms creating a challenging layout
    this.createPlatform(200, 600, 300, 20);
    this.createPlatform(600, 520, 200, 20);
    this.createPlatform(900, 440, 250, 20);
    this.createPlatform(350, 380, 180, 20);
    this.createPlatform(700, 300, 200, 20);
    this.createPlatform(200, 220, 150, 20);

    // Walls
    this.createPlatform(0, 350, 20, 700); // Left wall
    this.createPlatform(1180, 350, 20, 700); // Right wall

    // Some obstacles
    this.createPlatform(500, 600, 20, 100); // Vertical wall
    this.createPlatform(800, 520, 20, 80); // Another wall

    // Entrance (top left)
    this.entrance = this.add.rectangle(100, 50, 60, 60, 0x47C5FF);
    this.entrance.setStrokeStyle(3, 0xFFD93A);
    const entranceText = this.add.text(100, 50, '🚪', {
      fontSize: '40px',
    });
    entranceText.setOrigin(0.5);

    const entranceLabel = this.add.text(100, 90, 'INGÅNG', {
      fontSize: '12px',
      color: '#47C5FF',
      fontStyle: 'bold',
    });
    entranceLabel.setOrigin(0.5);

    // Exit (bottom right)
    this.exit = this.add.rectangle(1100, 640, 80, 80, 0x74D680);
    this.exit.setStrokeStyle(3, 0xFFD93A);
    const exitText = this.add.text(1100, 640, '🏁', {
      fontSize: '50px',
    });
    exitText.setOrigin(0.5);

    const exitLabel = this.add.text(1100, 590, 'UTGÅNG', {
      fontSize: '12px',
      color: '#74D680',
      fontStyle: 'bold',
    });
    exitLabel.setOrigin(0.5);

    // Add instructions
    const instructions = this.add.text(600, 30, 'Klicka på en förmåga, sedan på en gubbe för att tilldela!', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    });
    instructions.setOrigin(0.5);
  }

  private createPlatform(x: number, y: number, width: number, height: number): void {
    const platform = this.add.rectangle(x, y, width, height, 0x6a4a3a);
    platform.setStrokeStyle(2, 0x8B6F47);
    this.platforms?.add(platform);
  }

  private spawnCharacter(): void {
    if (this.spawnCount >= this.totalToSpawn || this.gameEnded) {
      this.spawnTimer?.remove();
      return;
    }

    const emoji = Phaser.Utils.Array.GetRandom(BRAINROT_EMOJIS);

    // Create sprite for physics
    const sprite = this.physics.add.sprite(100, 80, '');
    sprite.setDisplaySize(30, 30);
    sprite.setCircle(15); // Circular collision
    sprite.setBounce(0);
    sprite.setCollideWorldBounds(true);
    sprite.setInteractive();

    // Create text for visual
    const text = this.add.text(100, 80, emoji, {
      fontSize: '24px',
    });
    text.setOrigin(0.5);

    const character: BrainrotCharacter = {
      sprite,
      text,
      ability: null,
      facing: 1,
      isAlive: true,
      canClimb: false,
      isDigging: false,
      isBlocking: false,
      isBuilding: false,
      buildCount: 0,
      digCount: 0,
      emoji,
    };

    this.characters.push(character);
    this.spawnCount++;

    // Set up collisions
    if (this.platforms) {
      this.physics.add.collider(sprite, this.platforms);
    }
    if (this.buildPlatforms) {
      this.physics.add.collider(sprite, this.buildPlatforms);
    }

    this.updateStats();
  }

  private onCharacterClick(
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject
  ): void {
    if (this.isPaused || this.gameEnded) return;

    const selectedAbility = window.gameState?.selectedAbility;
    if (!selectedAbility) return;

    // Find the character that was clicked
    const character = this.characters.find(c => c.sprite === gameObject && c.isAlive);
    if (!character) return;

    // Check if character already has an ability
    if (character.ability) return;

    // Assign ability
    character.ability = selectedAbility as AbilityType;

    // Apply ability effects
    switch (selectedAbility) {
      case 'climb':
        character.canClimb = true;
        break;
      case 'block':
        character.isBlocking = true;
        character.sprite.setVelocityX(0);
        break;
      case 'dig':
        character.isDigging = true;
        break;
      case 'build':
        character.isBuilding = true;
        break;
    }

    // Add visual indicator
    const abilityIcon = this.getAbilityIcon(selectedAbility as AbilityType);
    const indicator = this.add.text(character.sprite.x, character.sprite.y - 25, abilityIcon, {
      fontSize: '16px',
    });
    indicator.setOrigin(0.5);

    // Make indicator follow character
    this.tweens.add({
      targets: indicator,
      alpha: 0.6,
      yoyo: true,
      repeat: -1,
      duration: 500,
    });

    // Use the ability
    if (window.useAbility) {
      window.useAbility(selectedAbility);
    }
  }

  private getAbilityIcon(ability: AbilityType): string {
    switch (ability) {
      case 'dig':
        return '⛏️';
      case 'build':
        return '🧱';
      case 'climb':
        return '🧗';
      case 'block':
        return '🛑';
      default:
        return '';
    }
  }

  update(): void {
    if (this.isPaused || this.gameEnded) return;

    this.characters.forEach(character => {
      if (!character.isAlive) return;

      // Update text position to follow sprite
      character.text.setPosition(character.sprite.x, character.sprite.y);

      // Check if reached exit
      if (this.exit && this.checkOverlap(character.sprite, this.exit)) {
        this.saveCharacter(character);
        return;
      }

      // Check if fell off the world
      if (character.sprite.y > 700) {
        this.loseCharacter(character);
        return;
      }

      // Handle blocking (do nothing)
      if (character.isBlocking) {
        character.sprite.setVelocityX(0);
        return;
      }

      // Handle digging
      if (character.isDigging) {
        this.handleDigging(character);
        return;
      }

      // Handle building
      if (character.isBuilding) {
        this.handleBuilding(character);
      } else {
        // Normal walking behavior
        this.handleWalking(character);
      }
    });

    // Check if game should end
    if (this.spawnCount >= this.totalToSpawn && this.characters.every(c => !c.isAlive)) {
      this.endGame();
    }
  }

  private handleWalking(character: BrainrotCharacter): void {
    const speed = 50 * this.gameSpeed;
    character.sprite.setVelocityX(speed * character.facing);

    // Check for walls or edges
    const body = character.sprite.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.left || body.blocked.right) {
      // Hit a wall
      if (!character.canClimb) {
        // Turn around
        character.facing *= -1;
      } else {
        // Climb up
        character.sprite.setVelocityY(-200);
      }
    }
  }

  private handleDigging(character: BrainrotCharacter): void {
    character.sprite.setVelocityX(0);

    if (character.digCount >= MAX_DIG_STEPS) {
      character.isDigging = false;
      return;
    }

    // Dig through platform below
    const digInterval = 300 / this.gameSpeed;
    if (!character.sprite.getData('lastDigTime')) {
      character.sprite.setData('lastDigTime', 0);
    }

    const now = this.time.now;
    const lastDig = character.sprite.getData('lastDigTime');

    if (now - lastDig > digInterval) {
      character.sprite.setData('lastDigTime', now);
      character.digCount++;

      // Create a small hole effect (visual only, character falls through)
      const hole = this.add.rectangle(
        character.sprite.x,
        character.sprite.y + 20,
        30,
        10,
        0x000000
      );
      this.tweens.add({
        targets: hole,
        alpha: 0,
        duration: 500,
        onComplete: () => hole.destroy(),
      });

      // Move character down
      character.sprite.y += 10;
    }
  }

  private handleBuilding(character: BrainrotCharacter): void {
    if (character.buildCount >= MAX_BUILD_STEPS) {
      character.isBuilding = false;
      this.handleWalking(character);
      return;
    }

    const buildInterval = 400 / this.gameSpeed;
    if (!character.sprite.getData('lastBuildTime')) {
      character.sprite.setData('lastBuildTime', 0);
    }

    const now = this.time.now;
    const lastBuild = character.sprite.getData('lastBuildTime');

    if (now - lastBuild > buildInterval) {
      character.sprite.setData('lastBuildTime', now);

      // Build a step
      const stepX = character.sprite.x + (character.facing * 15);
      const stepY = character.sprite.y + 5 - character.buildCount * 8;

      const step = this.add.rectangle(stepX, stepY, 30, 10, 0x8B6F47);
      step.setStrokeStyle(1, 0x6a4a3a);
      this.buildPlatforms?.add(step);

      // Move character up and forward
      character.sprite.x += character.facing * 15;
      character.sprite.y -= 8;

      character.buildCount++;

      // Re-enable collisions
      if (this.buildPlatforms) {
        this.physics.add.collider(character.sprite, this.buildPlatforms);
      }
    }
  }

  private checkOverlap(
    sprite: Phaser.Physics.Arcade.Sprite,
    rect: Phaser.GameObjects.Rectangle
  ): boolean {
    const bounds1 = sprite.getBounds();
    const bounds2 = rect.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(bounds1, bounds2);
  }

  private saveCharacter(character: BrainrotCharacter): void {
    character.isAlive = false;
    this.savedCount++;

    // Visual effect
    this.tweens.add({
      targets: [character.sprite, character.text],
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => {
        character.sprite.destroy();
        character.text.destroy();
      },
    });

    this.updateStats();
  }

  private loseCharacter(character: BrainrotCharacter): void {
    character.isAlive = false;
    this.lostCount++;

    // Visual effect
    this.tweens.add({
      targets: [character.sprite, character.text],
      alpha: 0,
      y: '+=50',
      duration: 300,
      onComplete: () => {
        character.sprite.destroy();
        character.text.destroy();
      },
    });

    this.updateStats();
  }

  private updateStats(): void {
    if (window.updateGameStats) {
      window.updateGameStats({
        spawned: this.spawnCount,
        saved: this.savedCount,
        lost: this.lostCount,
        abilities: window.gameState.abilities,
        selectedAbility: window.gameState.selectedAbility,
      });
    }
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      if (this.spawnTimer) {
        this.spawnTimer.paused = true;
      }
    } else {
      this.physics.resume();
      if (this.spawnTimer) {
        this.spawnTimer.paused = false;
      }
    }
  }

  private toggleSpeed(): void {
    this.gameSpeed = this.gameSpeed === 1 ? 2 : 1;
  }

  private endGame(): void {
    if (this.gameEnded) return;
    this.gameEnded = true;

    const successRate = this.savedCount / this.totalToSpawn;
    const won = successRate >= 0.5;

    if (window.showGameOver) {
      window.showGameOver(won, this.savedCount, this.totalToSpawn);
    }
  }
}
