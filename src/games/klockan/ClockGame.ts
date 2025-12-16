import Phaser from 'phaser';
import { saveScore, getHighScore } from '../../common/utils';
import { addCurrency, formatCurrency, getTotalCurrency } from '../../common/currency';
import { getTotalMultiplier, getClockVisualEffect } from '../../common/shop';

interface TimeOption {
  hours: number;
  minutes: number;
  text: string;
}

type DifficultyLevel = 'easy' | 'medium' | 'hard';

export class ClockGame extends Phaser.Scene {
  private clockCenterX!: number;
  private clockCenterY!: number;
  private clockRadius!: number;
  private clockFace!: Phaser.GameObjects.Arc;
  private clockGlow?: Phaser.GameObjects.Arc;
  private hourHand!: Phaser.GameObjects.Line;
  private minuteHand!: Phaser.GameObjects.Line;
  private currentHours!: number;
  private currentMinutes!: number;
  private score: number = 0;
  private correctAnswers: number = 0;
  private totalEarnings: number = 0;
  private currentMultiplier: number = 10;
  private optionButtons: Phaser.GameObjects.Container[] = [];
  private feedbackText!: Phaser.GameObjects.Text;
  private earningsText!: Phaser.GameObjects.Text;
  private numberTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'ClockGame' });
  }

  create(): void {
    this.score = 0;
    this.correctAnswers = 0;
    this.totalEarnings = 0;

    // Get current multiplier from shop
    this.currentMultiplier = getTotalMultiplier();

    // Set clock dimensions
    this.clockCenterX = 400;
    this.clockCenterY = 250;
    this.clockRadius = 120;

    // Add title and instructions
    this.add.text(400, 30, 'Vilken tid är klockan?', {
      fontSize: '28px',
      color: '#1A1A1A',
      fontFamily: 'Fredoka One',
    }).setOrigin(0.5);

    // Add earnings and multiplier display
    this.earningsText = this.add.text(400, 70, `Tjänat: ${formatCurrency(0)}`, {
      fontSize: '20px',
      color: '#FFD700',
      fontFamily: 'Nunito',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(400, 95, `⚡ ${formatCurrency(this.currentMultiplier)} per rätt svar`, {
      fontSize: '16px',
      color: '#3A78FF',
      fontFamily: 'Nunito',
    }).setOrigin(0.5);

    // Draw the clock with visual effects
    this.drawClock();
    this.applyClockVisuals();

    // Display high score
    const highScore = getHighScore('klockan');
    if (highScore !== null) {
      this.add.text(400, 580, `Rekord: ${highScore} rätt`, {
        fontSize: '18px',
        color: '#1A1A1A',
        fontFamily: 'Nunito',
      }).setOrigin(0.5);
    }

    // Feedback text (initialize before generateNewQuestion!)
    this.feedbackText = this.add.text(400, 480, '', {
      fontSize: '24px',
      color: '#74D680',
      fontFamily: 'Nunito',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Initialize top-right currency display
    this.updateScoreDisplay();

    // Generate a new time question (must be after feedbackText initialization)
    this.generateNewQuestion();
  }

  private drawClock(): void {
    // Clock face
    this.clockFace = this.add.circle(
      this.clockCenterX,
      this.clockCenterY,
      this.clockRadius,
      0xFFFFFF
    );
    this.clockFace.setStrokeStyle(6, 0x1A1A1A);

    // Clock center dot
    this.add.circle(this.clockCenterX, this.clockCenterY, 8, 0x1A1A1A);

    // Hour markers
    for (let i = 1; i <= 12; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x = this.clockCenterX + Math.cos(angle) * (this.clockRadius - 20);
      const y = this.clockCenterY + Math.sin(angle) * (this.clockRadius - 20);

      const numberText = this.add.text(x, y, i.toString(), {
        fontSize: '24px',
        color: '#1A1A1A',
        fontFamily: 'Fredoka One',
      }).setOrigin(0.5);

      // Store reference for later color changes
      this.numberTexts.push(numberText);
    }

    // Initialize clock hands (will be updated with actual time)
    this.hourHand = this.add.line(
      0, 0,
      this.clockCenterX, this.clockCenterY,
      this.clockCenterX, this.clockCenterY - 60,
      0x1A1A1A,
      1
    );
    this.hourHand.setLineWidth(8);
    this.hourHand.setOrigin(0, 0);

    this.minuteHand = this.add.line(
      0, 0,
      this.clockCenterX, this.clockCenterY,
      this.clockCenterX, this.clockCenterY - 90,
      0x3A78FF,
      1
    );
    this.minuteHand.setLineWidth(6);
    this.minuteHand.setOrigin(0, 0);
  }

  private updateClockHands(hours: number, minutes: number): void {
    // Calculate angles (12 o'clock is -90 degrees)
    const minuteAngle = (minutes * 6 - 90) * (Math.PI / 180);
    const hourAngle = ((hours % 12) * 30 + minutes * 0.5 - 90) * (Math.PI / 180);

    // Update minute hand
    const minuteX = this.clockCenterX + Math.cos(minuteAngle) * 90;
    const minuteY = this.clockCenterY + Math.sin(minuteAngle) * 90;
    this.minuteHand.setTo(
      this.clockCenterX, this.clockCenterY,
      minuteX, minuteY
    );

    // Update hour hand
    const hourX = this.clockCenterX + Math.cos(hourAngle) * 60;
    const hourY = this.clockCenterY + Math.sin(hourAngle) * 60;
    this.hourHand.setTo(
      this.clockCenterX, this.clockCenterY,
      hourX, hourY
    );
  }

  private getDifficultyLevel(): DifficultyLevel {
    if (this.correctAnswers < 10) {
      return 'easy';
    } else if (this.correctAnswers < 20) {
      return 'medium';
    } else {
      return 'hard';
    }
  }

  private generateNewQuestion(): void {
    // Clear previous buttons
    this.optionButtons.forEach(btn => btn.destroy());
    this.optionButtons = [];
    this.feedbackText.setText('');

    const difficulty = this.getDifficultyLevel();
    const possibleMinutes = [0, 15, 30, 45];

    // Generate a random time based on difficulty
    if (difficulty === 'easy') {
      // Easy: 12-hour format (1-12)
      this.currentHours = Phaser.Math.Between(1, 12);
    } else if (difficulty === 'medium') {
      // Medium: 24-hour format (13-23 for afternoon/evening)
      this.currentHours = Phaser.Math.Between(13, 23);
    } else {
      // Hard: mix of 12-hour and 24-hour
      this.currentHours = Phaser.Math.Between(1, 23);
    }

    this.currentMinutes = Phaser.Utils.Array.GetRandom(possibleMinutes);

    // Update the clock display
    this.updateClockHands(this.currentHours, this.currentMinutes);

    // Generate answer options
    const correctAnswer = this.formatTimeForDifficulty(this.currentHours, this.currentMinutes, difficulty);
    const options = this.generateOptions(this.currentHours, this.currentMinutes);

    // Shuffle options
    Phaser.Utils.Array.Shuffle(options);

    // Create option buttons
    const buttonY = 420;
    const buttonSpacing = 200;
    const startX = 400 - ((options.length - 1) * buttonSpacing) / 2;

    options.forEach((option, index) => {
      const x = startX + index * buttonSpacing;
      const isCorrect = option.text === correctAnswer;

      const button = this.createOptionButton(x, buttonY, option.text, isCorrect);
      this.optionButtons.push(button);
    });
  }

  private createOptionButton(
    x: number,
    y: number,
    text: string,
    isCorrect: boolean
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.rectangle(0, 0, 160, 60, 0xFFFFFF);
    bg.setStrokeStyle(4, 0x3A78FF);
    bg.setInteractive({ useHandCursor: true });

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '24px',
      color: '#3A78FF',
      fontFamily: 'Nunito',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, buttonText]);

    // Handle click
    bg.on('pointerdown', () => {
      this.handleAnswer(isCorrect, container);
    });

    // Hover effect
    bg.on('pointerover', () => {
      bg.setFillStyle(0x3A78FF);
      buttonText.setColor('#FFFFFF');
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0xFFFFFF);
      buttonText.setColor('#3A78FF');
    });

    return container;
  }

  private handleAnswer(isCorrect: boolean, button: Phaser.GameObjects.Container): void {
    // Disable all buttons
    this.optionButtons.forEach(btn => {
      const bg = btn.getAt(0);
      if (bg && 'disableInteractive' in bg) {
        (bg as Phaser.GameObjects.Rectangle).disableInteractive();
      }
    });

    if (isCorrect) {
      // Correct answer
      this.correctAnswers++;
      this.score += 10;

      // Add currency to total
      this.totalEarnings += this.currentMultiplier;
      addCurrency(this.currentMultiplier);

      // Update earnings display
      this.earningsText.setText(`Tjänat: ${formatCurrency(this.totalEarnings)}`);

      // Show floating earnings animation
      this.showEarningsAnimation(button.x, button.y);

      this.updateScoreDisplay();

      // Visual feedback
      const bg = button.getAt(0);
      const text = button.getAt(1);
      if (bg && 'setFillStyle' in bg) {
        (bg as Phaser.GameObjects.Rectangle).setFillStyle(0x74D680);
      }
      if (text && 'setColor' in text) {
        (text as Phaser.GameObjects.Text).setColor('#FFFFFF');
      }

      this.feedbackText.setText('🎉 Rätt!');
      this.feedbackText.setColor('#74D680');

      // Play success animation
      this.tweens.add({
        targets: button,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
      });

      // Save high score
      saveScore('klockan', this.correctAnswers);
    } else {
      // Wrong answer
      const bg = button.getAt(0);
      const text = button.getAt(1);
      if (bg && 'setFillStyle' in bg) {
        (bg as Phaser.GameObjects.Rectangle).setFillStyle(0xFF7DD1);
      }
      if (text && 'setColor' in text) {
        (text as Phaser.GameObjects.Text).setColor('#FFFFFF');
      }

      this.feedbackText.setText('❌ Försök igen!');
      this.feedbackText.setColor('#FF7DD1');

      // Shake animation
      this.tweens.add({
        targets: button,
        x: button.x - 10,
        duration: 50,
        yoyo: true,
        repeat: 3,
      });
    }

    // Move to next question after delay
    this.time.delayedCall(1500, () => {
      this.generateNewQuestion();
    });
  }

  private formatTime(hours: number, minutes: number): string {
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  private formatTimeAsText(hours: number, minutes: number): string {
    const hourNames = [
      '', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv',
      'tretton', 'fjorton', 'femton', 'sexton', 'sjutton', 'arton', 'nitton', 'tjugo', 'tjugoett', 'tjugotvå', 'tjugotre'
    ];

    const displayHour = hours % 24;

    if (minutes === 0) {
      return `Klockan ${hourNames[displayHour]}`;
    } else if (minutes === 15) {
      return `Kvart över ${hourNames[displayHour]}`;
    } else if (minutes === 30) {
      // For "halv", we always refer to the next hour in 12-hour format
      // e.g., 14:30 = "Halv tre" (not "Halv femton")
      const nextHour = displayHour + 1;
      const displayNextHour = nextHour > 12 ? nextHour - 12 : nextHour;
      return `Halv ${hourNames[displayNextHour]}`;
    } else if (minutes === 45) {
      // For "kvart i", we always refer to the next hour in 12-hour format
      // e.g., 14:45 = "Kvart i tre" (not "Kvart i femton")
      const nextHour = displayHour + 1;
      const displayNextHour = nextHour > 12 ? nextHour - 12 : nextHour;
      return `Kvart i ${hourNames[displayNextHour]}`;
    }

    return this.formatTime(hours, minutes);
  }

  private formatTimeForDifficulty(hours: number, minutes: number, difficulty: DifficultyLevel): string {
    if (difficulty === 'hard') {
      // For hard difficulty, use text representation
      return this.formatTimeAsText(hours, minutes);
    } else {
      // For easy and medium, use digital format
      return this.formatTime(hours, minutes);
    }
  }

  private generateOptions(correctHours: number, correctMinutes: number): TimeOption[] {
    const options: TimeOption[] = [];
    const difficulty = this.getDifficultyLevel();
    const correctText = this.formatTimeForDifficulty(correctHours, correctMinutes, difficulty);

    // Add correct answer
    options.push({
      hours: correctHours,
      minutes: correctMinutes,
      text: correctText,
    });

    // Generate 2 wrong answers
    const possibleMinutes = [0, 15, 30, 45];
    while (options.length < 3) {
      let wrongHours = correctHours;
      let wrongMinutes = correctMinutes;

      // Randomly modify either hours or minutes
      if (Math.random() > 0.5) {
        // Change hours based on difficulty
        if (difficulty === 'easy') {
          wrongHours = Phaser.Math.Between(1, 12);
        } else if (difficulty === 'medium') {
          wrongHours = Phaser.Math.Between(13, 23);
        } else {
          wrongHours = Phaser.Math.Between(1, 23);
        }
      } else {
        // Change minutes
        wrongMinutes = Phaser.Utils.Array.GetRandom(possibleMinutes);
      }

      const wrongText = this.formatTimeForDifficulty(wrongHours, wrongMinutes, difficulty);

      // Make sure it's not already in options
      if (!options.find(opt => opt.text === wrongText)) {
        options.push({
          hours: wrongHours,
          minutes: wrongMinutes,
          text: wrongText,
        });
      }
    }

    return options;
  }

  private updateScoreDisplay(): void {
    if (window.updateCurrency) {
      window.updateCurrency(getTotalCurrency());
    }
  }

  private applyClockVisuals(): void {
    const visualEffect = getClockVisualEffect();

    // Reset number colors to default black
    this.numberTexts.forEach(text => {
      text.setColor('#1A1A1A');
    });

    switch (visualEffect) {
      case 'gold-clock':
        // Golden clock
        this.clockFace.setFillStyle(0xFFD700);
        this.clockFace.setStrokeStyle(8, 0xDAA520);

        // Add glow effect
        this.clockGlow = this.add.circle(
          this.clockCenterX,
          this.clockCenterY,
          this.clockRadius + 10,
          0xFFD700,
          0.3
        );
        this.clockGlow.setDepth(-1);

        // Animate glow
        this.tweens.add({
          targets: this.clockGlow,
          alpha: 0.5,
          duration: 1000,
          yoyo: true,
          repeat: -1,
        });

        // Golden hands - dark hour hand, bright minute hand for visibility
        this.hourHand.setStrokeStyle(8, 0x8B4513); // Dark brown/bronze
        this.minuteHand.setStrokeStyle(6, 0x1A1A1A); // Black for contrast
        break;

      case 'common-car':
        // Silver/blue common car theme
        this.clockFace.setFillStyle(0xE0E0E0);
        this.clockFace.setStrokeStyle(8, 0x4A90E2);

        // Add subtle glow effect
        this.clockGlow = this.add.circle(
          this.clockCenterX,
          this.clockCenterY,
          this.clockRadius + 10,
          0x4A90E2,
          0.2
        );
        this.clockGlow.setDepth(-1);

        // Animate glow
        this.tweens.add({
          targets: this.clockGlow,
          alpha: 0.4,
          duration: 1500,
          yoyo: true,
          repeat: -1,
        });

        this.hourHand.setStrokeStyle(8, 0x2C3E50);
        this.minuteHand.setStrokeStyle(6, 0x4A90E2);
        break;

      case 'lamborghini':
        // Gold clock with red accents - red and black hands for visibility
        this.clockFace.setFillStyle(0xFFD700);
        this.clockFace.setStrokeStyle(8, 0xFF0000);

        if (this.clockGlow) {
          this.clockGlow.setFillStyle(0xFF0000, 0.3);
        }

        // Red hour hand, black minute hand for contrast against gold
        this.hourHand.setStrokeStyle(8, 0xFF0000);
        this.minuteHand.setStrokeStyle(6, 0x1A1A1A); // Black for visibility
        break;

      case 'iron':
        // Silver/iron metallic with dark hands for visibility
        this.clockFace.setFillStyle(0xC0C0C0);
        this.clockFace.setStrokeStyle(8, 0x808080);

        if (this.clockGlow) {
          this.clockGlow.setFillStyle(0xE8E8E8, 0.4);
        }

        // Dark hands for good contrast against silver
        this.hourHand.setStrokeStyle(8, 0x2C3E50); // Dark blue/gray
        this.minuteHand.setStrokeStyle(6, 0x1A1A1A); // Black
        break;

      case 'black-hole':
        // Black hole theme - very dark with intense purple glow
        this.clockFace.setFillStyle(0x1A1A1A); // Very dark/black
        this.clockFace.setStrokeStyle(8, 0x7B2CBF); // Deep purple

        // Add intense purple glow effect
        this.clockGlow = this.add.circle(
          this.clockCenterX,
          this.clockCenterY,
          this.clockRadius + 10,
          0x9D4EDD,
          0.6
        );
        this.clockGlow.setDepth(-1);

        // Intense pulsing glow animation
        this.tweens.add({
          targets: this.clockGlow,
          scaleX: 1.2,
          scaleY: 1.2,
          alpha: 0.8,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // Bright hands for maximum visibility on dark background
        this.hourHand.setStrokeStyle(8, 0xFFFFFF); // White
        this.minuteHand.setStrokeStyle(6, 0xC77DFF); // Light purple

        // Purple numbers for the black hole theme
        this.numberTexts.forEach(text => {
          text.setColor('#C77DFF'); // Light purple
        });
        break;

      case 'galaxy':
        // Purple/blue galaxy theme
        this.clockFace.setFillStyle(0x764ba2);
        this.clockFace.setStrokeStyle(8, 0x667eea);

        if (this.clockGlow) {
          this.clockGlow.setFillStyle(0xf093fb, 0.5);

          // Extra glow animation
          this.tweens.add({
            targets: this.clockGlow,
            scaleX: 1.1,
            scaleY: 1.1,
            alpha: 0.7,
            duration: 2000,
            yoyo: true,
            repeat: -1,
          });
        }

        this.hourHand.setStrokeStyle(8, 0xf093fb);
        this.minuteHand.setStrokeStyle(6, 0x667eea);
        break;

      default:
        // Default white clock
        this.clockFace.setFillStyle(0xFFFFFF);
        this.clockFace.setStrokeStyle(6, 0x1A1A1A);
        break;
    }
  }

  private showEarningsAnimation(x: number, y: number): void {
    const text = this.add.text(x, y, `+${formatCurrency(this.currentMultiplier)}`, {
      fontSize: '32px',
      color: '#FFD700',
      fontFamily: 'Nunito',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Floating animation
    this.tweens.add({
      targets: text,
      y: y - 100,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      },
    });
  }
}
