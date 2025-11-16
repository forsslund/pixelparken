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

  // New features
  private streak: number = 0;
  private streakText!: Phaser.GameObjects.Text;
  private difficultyLevel: number = 1; // 1 = quarters, 2 = 5min, 3 = 1min
  private questionCount: number = 0;
  private particles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private clockGlow?: Phaser.GameObjects.Arc;

  constructor() {
    super({ key: 'ClockGame' });
  }

  preload(): void {
    // Create a simple particle texture
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('particle', 16, 16);
    graphics.destroy();
  }

  create(): void {
    this.score = 0;
    this.correctAnswers = 0;
    this.streak = 0;
    this.questionCount = 0;
    this.difficultyLevel = 1;

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

    // Add pulsating glow effect around clock
    this.clockGlow = this.add.circle(
      this.clockCenterX,
      this.clockCenterY,
      this.clockRadius + 10,
      0x3A78FF,
      0.2
    );
    this.clockGlow.setDepth(-1);

    // Pulsating animation
    this.tweens.add({
      targets: this.clockGlow,
      alpha: 0.4,
      scale: 1.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Display high score
    const highScore = getHighScore('klockan');
    if (highScore !== null) {
      this.add.text(400, 580, `Rekord: ${highScore} rätt`, {
        fontSize: '18px',
        color: '#1A1A1A',
        fontFamily: 'Nunito',
      }).setOrigin(0.5);
    }

    // Streak display
    this.streakText = this.add.text(50, 30, '', {
      fontSize: '22px',
      color: '#FFD93A',
      fontFamily: 'Fredoka One',
    });

    // Feedback text (initialize before generateNewQuestion!)
    this.feedbackText = this.add.text(400, 480, '', {
      fontSize: '24px',
      color: '#74D680',
      fontFamily: 'Nunito',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Create particle emitter for celebrations
    this.particles = this.add.particles(0, 0, 'particle', {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 1000,
      gravityY: 200,
      frequency: -1, // Manual emit
      tint: [0x3A78FF, 0xFFD93A, 0x74D680, 0xFF7DD1, 0x47C5FF],
    });

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

  private updateClockHands(hours: number, minutes: number, animate: boolean = true): void {
    // Calculate angles (12 o'clock is -90 degrees)
    const minuteAngle = (minutes * 6 - 90) * (Math.PI / 180);
    const hourAngle = ((hours % 12) * 30 + minutes * 0.5 - 90) * (Math.PI / 180);

    // Calculate new positions
    const minuteX = this.clockCenterX + Math.cos(minuteAngle) * 90;
    const minuteY = this.clockCenterY + Math.sin(minuteAngle) * 90;
    const hourX = this.clockCenterX + Math.cos(hourAngle) * 60;
    const hourY = this.clockCenterY + Math.sin(hourAngle) * 60;

    if (animate && this.questionCount > 0) {
      // Animate the clock hands smoothly
      const duration = 800;

      // Store current positions
      const currentMinuteX = this.minuteHand.geom.x2;
      const currentMinuteY = this.minuteHand.geom.y2;
      const currentHourX = this.hourHand.geom.x2;
      const currentHourY = this.hourHand.geom.y2;

      // Animate minute hand using a proxy object
      const minuteProxy: { x: number; y: number } = { x: currentMinuteX, y: currentMinuteY };
      this.tweens.add({
        targets: minuteProxy,
        x: minuteX,
        y: minuteY,
        duration: duration,
        ease: 'Back.easeOut',
        onUpdate: () => {
          this.minuteHand.setTo(
            this.clockCenterX, this.clockCenterY,
            minuteProxy.x, minuteProxy.y
          );
        },
      });

      // Animate hour hand using a proxy object
      const hourProxy: { x: number; y: number } = { x: currentHourX, y: currentHourY };
      this.tweens.add({
        targets: hourProxy,
        x: hourX,
        y: hourY,
        duration: duration,
        ease: 'Back.easeOut',
        onUpdate: () => {
          this.hourHand.setTo(
            this.clockCenterX, this.clockCenterY,
            hourProxy.x, hourProxy.y
          );
        },
      });

      // Play tick sound
      this.playSound('tick');
    } else {
      // Update immediately (first question)
      this.minuteHand.setTo(
        this.clockCenterX, this.clockCenterY,
        minuteX, minuteY
      );
      this.hourHand.setTo(
        this.clockCenterX, this.clockCenterY,
        hourX, hourY
      );
    }
  }

  private generateNewQuestion(): void {
    // Clear previous buttons
    this.optionButtons.forEach(btn => btn.destroy());
    this.optionButtons = [];
    this.feedbackText.setText('');

    // Increment question count
    this.questionCount++;

    // Progress difficulty based on correct answers
    if (this.correctAnswers >= 10 && this.difficultyLevel < 2) {
      this.difficultyLevel = 2; // Unlock 5-minute increments
      this.showDifficultyMessage('🎯 Nivå 2: 5-minuters intervall!');
    } else if (this.correctAnswers >= 20 && this.difficultyLevel < 3) {
      this.difficultyLevel = 3; // Unlock 1-minute increments
      this.showDifficultyMessage('🏆 Nivå 3: 1-minuters intervall!');
    }

    // Generate a random time based on difficulty level
    let possibleMinutes: number[];
    if (this.difficultyLevel === 1) {
      possibleMinutes = [0, 15, 30, 45]; // Quarters
    } else if (this.difficultyLevel === 2) {
      possibleMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]; // 5-minute
    } else {
      possibleMinutes = Array.from({ length: 60 }, (_, i) => i); // Every minute
    }

    this.currentHours = Phaser.Math.Between(1, 12);
    this.currentMinutes = Phaser.Utils.Array.GetRandom(possibleMinutes);

    // Update the clock display with animation
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
      // Increment streak
      this.streak++;
      this.updateStreakDisplay();

      // Calculate bonus points for streaks
      let points = 10;
      let bonusMultiplier = 1;
      if (this.streak >= 5) bonusMultiplier = 1.5;
      if (this.streak >= 10) bonusMultiplier = 2;
      if (this.streak >= 15) bonusMultiplier = 3;

      points = Math.floor(points * bonusMultiplier);

      // Correct answer
      this.correctAnswers++;
      this.score += points;
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

      // Varied encouraging messages
      const messages = [
        '🎉 Rätt!',
        '⭐ Perfekt!',
        '🌟 Utmärkt!',
        '💫 Fantastiskt!',
        '🎯 Spot on!',
        '✨ Bravo!',
        '🏆 Toppen!',
        '🎪 Suveränt!',
      ];

      // Special messages for streaks
      if (this.streak === 5) {
        this.feedbackText.setText('🔥 5 i rad!');
      } else if (this.streak === 10) {
        this.feedbackText.setText('🔥🔥 10 i rad!');
      } else if (this.streak === 15) {
        this.feedbackText.setText('🔥🔥🔥 15 i rad! AMAZING!');
      } else if (bonusMultiplier > 1) {
        this.feedbackText.setText(`${Phaser.Utils.Array.GetRandom(messages)} +${points}p! 🔥`);
      } else {
        this.feedbackText.setText(Phaser.Utils.Array.GetRandom(messages));
      }
      this.feedbackText.setColor('#74D680');

      // Play success animation
      this.tweens.add({
        targets: button,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
      });

      // Emit particles for celebration
      if (this.particles) {
        this.particles.setPosition(button.x, button.y - 30);
        this.particles.explode(20 + this.streak * 2); // More particles for longer streaks
      }

      // Extra celebration for milestone streaks
      if (this.streak % 5 === 0 && this.streak > 0) {
        this.cameras.main.shake(200, 0.002);
        if (this.clockGlow) {
          this.tweens.add({
            targets: this.clockGlow,
            alpha: 0.8,
            scale: 1.2,
            duration: 300,
            yoyo: true,
          });
        }
      }

      // Play success sound
      this.playSound('correct');

      // Save high score
      saveScore('klockan', this.correctAnswers);
    } else {
      // Reset streak
      this.streak = 0;
      this.updateStreakDisplay();

      // Wrong answer
      const bg = button.getAt(0);
      const text = button.getAt(1);
      if (bg && 'setFillStyle' in bg) {
        (bg as Phaser.GameObjects.Rectangle).setFillStyle(0xFF7DD1);
      }
      if (text && 'setColor' in text) {
        (text as Phaser.GameObjects.Text).setColor('#FFFFFF');
      }

      // Varied error messages
      const messages = [
        '❌ Försök igen!',
        '🤔 Inte riktigt!',
        '💭 Tänk efter!',
        '👀 Titta noga!',
        '⏰ Kolla igen!',
      ];

      this.feedbackText.setText(Phaser.Utils.Array.GetRandom(messages));
      this.feedbackText.setColor('#FF7DD1');

      // Shake animation
      this.tweens.add({
        targets: button,
        x: button.x - 10,
        duration: 50,
        yoyo: true,
        repeat: 3,
      });

      // Play error sound
      this.playSound('wrong');
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

    // Define possible minutes based on difficulty level
    let possibleMinutes: number[];
    if (this.difficultyLevel === 1) {
      possibleMinutes = [0, 15, 30, 45];
    } else if (this.difficultyLevel === 2) {
      possibleMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    } else {
      possibleMinutes = Array.from({ length: 60 }, (_, i) => i);
    }

    // Generate 2 wrong answers
    let attempts = 0;
    while (options.length < 3 && attempts < 100) {
      attempts++;
      let wrongHours = correctHours;
      let wrongMinutes = correctMinutes;

      // Randomly modify either hours or minutes (or both at higher difficulty)
      const modifyHours = Math.random() > 0.5;
      const modifyMinutes = Math.random() > 0.3;

      if (modifyHours) {
        // Change hours (but keep it close for challenge)
        const hourOffset = Phaser.Math.Between(-2, 2);
        wrongHours = ((correctHours - 1 + hourOffset + 12) % 12) + 1;
      }

      if (modifyMinutes) {
        // Change minutes
        wrongMinutes = Phaser.Utils.Array.GetRandom(possibleMinutes);
      }

      // Make sure at least one value is different
      if (wrongHours === correctHours && wrongMinutes === correctMinutes) {
        continue;
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

  private updateStreakDisplay(): void {
    if (this.streak > 0) {
      this.streakText.setText(`🔥 ${this.streak} i rad`);

      // Add scale animation for streak milestones
      if (this.streak % 5 === 0) {
        this.tweens.add({
          targets: this.streakText,
          scale: 1.3,
          duration: 200,
          yoyo: true,
        });
      }
    } else {
      this.streakText.setText('');
    }
  }

  private showDifficultyMessage(message: string): void {
    const difficultyText = this.add.text(400, 350, message, {
      fontSize: '26px',
      color: '#FFD93A',
      fontFamily: 'Fredoka One',
      backgroundColor: '#1A1A1A',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);

    // Animate in
    difficultyText.setAlpha(0);
    difficultyText.setScale(0.5);
    this.tweens.add({
      targets: difficultyText,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Fade out and remove
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: difficultyText,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          difficultyText.destroy();
        },
      });
    });

    // Play level up sound
    this.playSound('levelup');
  }

  private playSound(type: 'correct' | 'wrong' | 'tick' | 'levelup'): void {
    // Use Web Audio API to generate simple sounds
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound based on type
    switch (type) {
      case 'correct':
        // Happy ascending notes
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.exponentialRampToValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;

      case 'wrong':
        // Descending sad notes
        oscillator.frequency.setValueAtTime(329.63, audioContext.currentTime); // E4
        oscillator.frequency.exponentialRampToValueAtTime(261.63, audioContext.currentTime + 0.2); // C4
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;

      case 'tick':
        // Short tick sound
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
        break;

      case 'levelup': {
        // Triumphant ascending arpeggio
        const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        frequencies.forEach((freq, index) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
          gain.gain.setValueAtTime(0.2, audioContext.currentTime + index * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.2);
          osc.start(audioContext.currentTime + index * 0.1);
          osc.stop(audioContext.currentTime + index * 0.1 + 0.2);
        });
        return; // Skip the default oscillator cleanup
      }
    }
  }
}
