import Phaser from 'phaser';
import { saveScore, getHighScore } from '../../common/utils';

interface TimeOption {
  hours: number;
  minutes: number;
  text: string;
}

export class ClockGame extends Phaser.Scene {
  private clockCenterX!: number;
  private clockCenterY!: number;
  private clockRadius!: number;
  private hourHand!: Phaser.GameObjects.Line;
  private minuteHand!: Phaser.GameObjects.Line;
  private currentHours!: number;
  private currentMinutes!: number;
  private score: number = 0;
  private correctAnswers: number = 0;
  private optionButtons: Phaser.GameObjects.Container[] = [];
  private feedbackText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'ClockGame' });
  }

  create(): void {
    this.score = 0;
    this.correctAnswers = 0;

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

    // Draw the clock
    this.drawClock();

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

    // Generate a new time question (must be after feedbackText initialization)
    this.generateNewQuestion();
  }

  private drawClock(): void {
    // Clock face
    const clockFace = this.add.circle(
      this.clockCenterX,
      this.clockCenterY,
      this.clockRadius,
      0xFFFFFF
    );
    clockFace.setStrokeStyle(6, 0x1A1A1A);

    // Clock center dot
    this.add.circle(this.clockCenterX, this.clockCenterY, 8, 0x1A1A1A);

    // Hour markers
    for (let i = 1; i <= 12; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x = this.clockCenterX + Math.cos(angle) * (this.clockRadius - 20);
      const y = this.clockCenterY + Math.sin(angle) * (this.clockRadius - 20);

      this.add.text(x, y, i.toString(), {
        fontSize: '24px',
        color: '#1A1A1A',
        fontFamily: 'Fredoka One',
      }).setOrigin(0.5);
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

  private generateNewQuestion(): void {
    // Clear previous buttons
    this.optionButtons.forEach(btn => btn.destroy());
    this.optionButtons = [];
    this.feedbackText.setText('');

    // Generate a random time (simplified to hours and quarters)
    const possibleMinutes = [0, 15, 30, 45];
    this.currentHours = Phaser.Math.Between(1, 12);
    this.currentMinutes = Phaser.Utils.Array.GetRandom(possibleMinutes);

    // Update the clock display
    this.updateClockHands(this.currentHours, this.currentMinutes);

    // Generate answer options
    const correctAnswer = this.formatTime(this.currentHours, this.currentMinutes);
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

  private generateOptions(correctHours: number, correctMinutes: number): TimeOption[] {
    const options: TimeOption[] = [];
    const correctText = this.formatTime(correctHours, correctMinutes);

    // Add correct answer
    options.push({
      hours: correctHours,
      minutes: correctMinutes,
      text: correctText,
    });

    // Generate 2 wrong answers
    while (options.length < 3) {
      let wrongHours = correctHours;
      let wrongMinutes = correctMinutes;

      // Randomly modify either hours or minutes
      if (Math.random() > 0.5) {
        // Change hours
        wrongHours = Phaser.Math.Between(1, 12);
      } else {
        // Change minutes
        const possibleMinutes = [0, 15, 30, 45];
        wrongMinutes = Phaser.Utils.Array.GetRandom(possibleMinutes);
      }

      const wrongText = this.formatTime(wrongHours, wrongMinutes);

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
    if (window.updateScore) {
      window.updateScore(this.score);
    }
  }
}
