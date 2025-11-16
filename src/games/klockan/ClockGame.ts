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

    // Add title and instructions with playful design
    const titleBg = this.add.rectangle(400, 35, 450, 60, 0xFFFFFF, 0.9);
    titleBg.setStrokeStyle(4, 0x5B8CFF);

    this.add.text(400, 35, 'Vilken tid är klockan? 🕐', {
      fontSize: '32px',
      color: '#5B8CFF',
      fontFamily: 'Fredoka One',
    }).setOrigin(0.5);

    // Bounce animation for title
    this.tweens.add({
      targets: titleBg,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Draw the clock
    this.drawClock();

    // Display high score with playful design
    const highScore = getHighScore('klockan');
    if (highScore !== null) {
      const recordBg = this.add.rectangle(400, 580, 220, 45, 0xFFD93A, 0.8);
      recordBg.setStrokeStyle(3, 0xFFB366);

      const recordText = this.add.text(400, 580, `⭐ Rekord: ${highScore} rätt!`, {
        fontSize: '20px',
        color: '#2D2D2D',
        fontFamily: 'Fredoka One',
      }).setOrigin(0.5);

      // Gentle pulse
      this.tweens.add({
        targets: [recordBg, recordText],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Feedback text (initialize before generateNewQuestion!)
    this.feedbackText = this.add.text(400, 500, '', {
      fontSize: '32px',
      color: '#7FE68C',
      fontFamily: 'Fredoka One',
    }).setOrigin(0.5);

    // Generate a new time question (must be after feedbackText initialization)
    this.generateNewQuestion();
  }

  private drawClock(): void {
    // Clock face with soft shadow
    this.add.circle(
      this.clockCenterX + 4,
      this.clockCenterY + 4,
      this.clockRadius + 2,
      0x000000,
      0.1
    );

    const clockFace = this.add.circle(
      this.clockCenterX,
      this.clockCenterY,
      this.clockRadius,
      0xFFFDF7
    );
    clockFace.setStrokeStyle(8, 0x5B8CFF);

    // Add a subtle gradient effect with multiple circles
    this.add.circle(
      this.clockCenterX,
      this.clockCenterY,
      this.clockRadius - 10,
      0xFFFFFF,
      0.3
    );

    // Clock center dot - larger and more playful
    const centerDot = this.add.circle(this.clockCenterX, this.clockCenterY, 12, 0xFF8FDB);
    centerDot.setStrokeStyle(3, 0xFFFFFF);

    // Add a subtle pulse animation to the center dot
    this.tweens.add({
      targets: centerDot,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Hour markers with alternating colors
    const markerColors = ['#5B8CFF', '#FF8FDB', '#7FE68C', '#FFD93A'];
    for (let i = 1; i <= 12; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x = this.clockCenterX + Math.cos(angle) * (this.clockRadius - 25);
      const y = this.clockCenterY + Math.sin(angle) * (this.clockRadius - 25);

      const markerBg = this.add.circle(x, y, 18,
        parseInt(markerColors[(i - 1) % markerColors.length].replace('#', '0x'))
      );
      markerBg.setAlpha(0.3);

      const numberText = this.add.text(x, y, i.toString(), {
        fontSize: '28px',
        color: '#2D2D2D',
        fontFamily: 'Fredoka One',
      }).setOrigin(0.5);

      // Add bounce animation on creation
      numberText.setScale(0);
      this.tweens.add({
        targets: numberText,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        delay: i * 50,
        ease: 'Back.easeOut'
      });
    }

    // Initialize clock hands (will be updated with actual time)
    this.hourHand = this.add.line(
      0, 0,
      this.clockCenterX, this.clockCenterY,
      this.clockCenterX, this.clockCenterY - 60,
      0x2D2D2D,
      1
    );
    this.hourHand.setLineWidth(10);
    this.hourHand.setOrigin(0, 0);

    this.minuteHand = this.add.line(
      0, 0,
      this.clockCenterX, this.clockCenterY,
      this.clockCenterX, this.clockCenterY - 90,
      0x5B8CFF,
      1
    );
    this.minuteHand.setLineWidth(8);
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

    // Button shadow (soft drop shadow)
    const shadow = this.add.rectangle(2, 4, 180, 70, 0x000000, 0.15);
    shadow.setOrigin(0.5);

    // Button background - rounder and softer
    const bg = this.add.rectangle(0, 0, 180, 70, 0xFFFFFF);
    bg.setStrokeStyle(5, 0x5B8CFF);
    bg.setInteractive({ useHandCursor: true });

    // Add a subtle inner gradient with graphics
    const gradient = this.add.rectangle(0, -2, 170, 30, 0xFFFFFF, 0.5);
    gradient.setOrigin(0.5);

    // Button text - larger and friendlier
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '28px',
      color: '#5B8CFF',
      fontFamily: 'Fredoka One',
    }).setOrigin(0.5);

    container.add([shadow, bg, gradient, buttonText]);

    // Entrance animation
    container.setScale(0);
    this.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
      delay: 200
    });

    // Handle click
    bg.on('pointerdown', () => {
      this.handleAnswer(isCorrect, container);
    });

    // Hover effect - more bouncy
    bg.on('pointerover', () => {
      bg.setFillStyle(0x5B8CFF);
      buttonText.setColor('#FFFFFF');
      this.tweens.add({
        targets: container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        ease: 'Back.easeOut'
      });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0xFFFFFF);
      buttonText.setColor('#5B8CFF');
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Back.easeOut'
      });
    });

    return container;
  }

  private handleAnswer(isCorrect: boolean, button: Phaser.GameObjects.Container): void {
    // Disable all buttons
    this.optionButtons.forEach(btn => {
      const bg = btn.getAt(1);
      if (bg && 'disableInteractive' in bg) {
        (bg as Phaser.GameObjects.Rectangle).disableInteractive();
      }
    });

    if (isCorrect) {
      // Correct answer
      this.correctAnswers++;
      this.score += 10;
      this.updateScoreDisplay();

      // Visual feedback - index shifted by shadow
      const bg = button.getAt(1);
      const text = button.getAt(3);
      if (bg && 'setFillStyle' in bg) {
        (bg as Phaser.GameObjects.Rectangle).setFillStyle(0x7FE68C);
        (bg as Phaser.GameObjects.Rectangle).setStrokeStyle(5, 0x74D680);
      }
      if (text && 'setColor' in text) {
        (text as Phaser.GameObjects.Text).setColor('#FFFFFF');
      }

      this.feedbackText.setText('🎉 Suveränt!');
      this.feedbackText.setColor('#7FE68C');

      // Play success animation - bouncy celebration
      this.tweens.add({
        targets: button,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 300,
        ease: 'Back.easeOut',
        yoyo: true,
        repeat: 1
      });

      // Rotate animation for extra playfulness
      this.tweens.add({
        targets: button,
        angle: 360,
        duration: 600,
        ease: 'Back.easeOut'
      });

      // Feedback text bounce
      this.feedbackText.setScale(0);
      this.tweens.add({
        targets: this.feedbackText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 400,
        ease: 'Back.easeOut'
      });

      // Save high score
      saveScore('klockan', this.correctAnswers);
    } else {
      // Wrong answer
      const bg = button.getAt(1);
      const text = button.getAt(3);
      if (bg && 'setFillStyle' in bg) {
        (bg as Phaser.GameObjects.Rectangle).setFillStyle(0xFF8FDB);
        (bg as Phaser.GameObjects.Rectangle).setStrokeStyle(5, 0xFF7DD1);
      }
      if (text && 'setColor' in text) {
        (text as Phaser.GameObjects.Text).setColor('#FFFFFF');
      }

      this.feedbackText.setText('💫 Nästan! Prova igen');
      this.feedbackText.setColor('#FF8FDB');

      // Gentle shake animation - less harsh
      this.tweens.add({
        targets: button,
        x: button.x - 8,
        duration: 60,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut'
      });

      // Feedback text entrance
      this.feedbackText.setScale(0);
      this.tweens.add({
        targets: this.feedbackText,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        ease: 'Back.easeOut'
      });
    }

    // Move to next question after delay
    this.time.delayedCall(2000, () => {
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
