import Phaser from 'phaser';

export class MultiplicationTableScene extends Phaser.Scene {
    private discovered: Set<string> = new Set();
    private currentQuestion?: { num1: number; num2: number };
    private totalCells = 100; // 10x10 table

    // DOM elements
    private questionElement?: HTMLElement;
    private answerInput?: HTMLInputElement;
    private feedbackElement?: HTMLElement;
    private progressFill?: HTMLElement;
    private progressInfo?: HTMLElement;
    private submitButton?: HTMLButtonElement;
    private skipButton?: HTMLButtonElement;
    private completionMessage?: HTMLElement;

    constructor() {
        super({ key: 'MultiplicationTableScene' });
    }

    preload(): void {
        // No assets needed for this game
    }

    create(): void {
        this.discovered = new Set();
        this.createDOM();
        this.createMultiplicationTable();
        this.askNewQuestion();
    }

    private createDOM(): void {
        const container = document.getElementById('game-container');
        if (!container) return;

        container.innerHTML = `
            <h1 class="game-title">🧮 Multiplikationstabellen</h1>

            <div class="progress-info">
                <span id="progress-text">0 av ${this.totalCells} upptäckta</span>
            </div>

            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill" style="width: 0%">0%</div>
            </div>

            <div class="question-area">
                <div class="question-text" id="question"></div>
                <div>
                    <input type="number" class="answer-input" id="answer-input" placeholder="?" autocomplete="off">
                    <button class="btn btn-primary" id="submit-btn">Svara</button>
                    <button class="btn btn-secondary" id="skip-btn">Hoppa över</button>
                </div>
                <div class="feedback" id="feedback"></div>
            </div>

            <div id="completion-message" class="completion-message" style="display: none;"></div>

            <div class="multiplication-table" id="multiplication-table"></div>
        `;

        // Cache DOM references
        this.questionElement = document.getElementById('question') ?? undefined;
        this.answerInput = document.getElementById('answer-input') as HTMLInputElement | undefined;
        this.feedbackElement = document.getElementById('feedback') ?? undefined;
        this.progressFill = document.getElementById('progress-fill') ?? undefined;
        this.progressInfo = document.getElementById('progress-text') ?? undefined;
        this.submitButton = document.getElementById('submit-btn') as HTMLButtonElement | undefined;
        this.skipButton = document.getElementById('skip-btn') as HTMLButtonElement | undefined;
        this.completionMessage = document.getElementById('completion-message') ?? undefined;

        // Add event listeners
        this.submitButton?.addEventListener('click', () => this.checkAnswer());
        this.skipButton?.addEventListener('click', () => this.skipQuestion());

        this.answerInput?.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });
    }

    private createMultiplicationTable(): void {
        const tableElement = document.getElementById('multiplication-table');
        if (!tableElement) return;

        tableElement.innerHTML = '';

        // Top-left corner (empty)
        const cornerCell = document.createElement('div');
        cornerCell.className = 'table-cell table-header';
        cornerCell.textContent = '×';
        tableElement.appendChild(cornerCell);

        // Top row headers (1-10)
        for (let col = 1; col <= 10; col++) {
            const headerCell = document.createElement('div');
            headerCell.className = 'table-cell table-header';
            headerCell.textContent = col.toString();
            tableElement.appendChild(headerCell);
        }

        // Create table rows
        for (let row = 1; row <= 10; row++) {
            // Row header
            const rowHeader = document.createElement('div');
            rowHeader.className = 'table-cell table-header';
            rowHeader.textContent = row.toString();
            tableElement.appendChild(rowHeader);

            // Row cells
            for (let col = 1; col <= 10; col++) {
                const cell = document.createElement('div');
                cell.className = 'table-cell undiscovered';
                cell.id = `cell-${row}-${col}`;
                cell.dataset.row = row.toString();
                cell.dataset.col = col.toString();
                cell.dataset.answer = (row * col).toString();
                cell.textContent = (row * col).toString();
                tableElement.appendChild(cell);
            }
        }
    }

    private askNewQuestion(): void {
        // Find all undiscovered cells
        const undiscovered: Array<{ num1: number; num2: number }> = [];

        for (let row = 1; row <= 10; row++) {
            for (let col = 1; col <= 10; col++) {
                const key = `${row}-${col}`;
                if (!this.discovered.has(key)) {
                    undiscovered.push({ num1: row, num2: col });
                }
            }
        }

        if (undiscovered.length === 0) {
            this.showCompletion();
            return;
        }

        // Pick a random undiscovered cell
        const randomIndex = Math.floor(Math.random() * undiscovered.length);
        this.currentQuestion = undiscovered[randomIndex];

        if (this.questionElement) {
            this.questionElement.textContent = `Vad är ${this.currentQuestion.num1} × ${this.currentQuestion.num2}?`;
        }

        if (this.answerInput) {
            this.answerInput.value = '';
            this.answerInput.focus();
        }

        if (this.feedbackElement) {
            this.feedbackElement.textContent = '';
            this.feedbackElement.className = 'feedback';
        }
    }

    private checkAnswer(): void {
        if (!this.currentQuestion || !this.answerInput) return;

        const userAnswer = parseInt(this.answerInput.value);
        const correctAnswer = this.currentQuestion.num1 * this.currentQuestion.num2;

        if (isNaN(userAnswer)) {
            if (this.feedbackElement) {
                this.feedbackElement.textContent = 'Ange ett tal!';
                this.feedbackElement.className = 'feedback incorrect';
            }
            return;
        }

        if (userAnswer === correctAnswer) {
            this.revealCell(this.currentQuestion.num1, this.currentQuestion.num2);

            if (this.feedbackElement) {
                this.feedbackElement.textContent = '🎉 Rätt svar! Bra jobbat!';
                this.feedbackElement.className = 'feedback correct';
            }

            // Ask new question after a short delay
            this.time.delayedCall(1500, () => {
                this.askNewQuestion();
            });
        } else {
            if (this.feedbackElement) {
                this.feedbackElement.textContent = `❌ Fel svar. Försök igen!`;
                this.feedbackElement.className = 'feedback incorrect';
            }

            if (this.answerInput) {
                this.answerInput.value = '';
                this.answerInput.focus();
            }
        }
    }

    private skipQuestion(): void {
        if (this.feedbackElement) {
            this.feedbackElement.textContent = 'Frågan hoppades över';
            this.feedbackElement.className = 'feedback';
        }

        this.time.delayedCall(500, () => {
            this.askNewQuestion();
        });
    }

    private revealCell(row: number, col: number): void {
        const key = `${row}-${col}`;
        this.discovered.add(key);

        const cell = document.getElementById(`cell-${row}-${col}`);
        if (cell) {
            cell.classList.remove('undiscovered');
            cell.classList.add('discovered');
        }

        this.updateProgress();
    }

    private updateProgress(): void {
        const discovered = this.discovered.size;
        const percentage = Math.round((discovered / this.totalCells) * 100);

        if (this.progressFill) {
            this.progressFill.style.width = `${percentage}%`;
            this.progressFill.textContent = `${percentage}%`;
        }

        if (this.progressInfo) {
            this.progressInfo.textContent = `${discovered} av ${this.totalCells} upptäckta`;
        }
    }

    private showCompletion(): void {
        if (this.completionMessage) {
            this.completionMessage.textContent = '🎊 Grattis! Du har lärt dig hela multiplikationstabellen! 🎊';
            this.completionMessage.style.display = 'block';
        }

        // Hide question area
        const questionArea = document.querySelector('.question-area') as HTMLElement;
        if (questionArea) {
            questionArea.style.display = 'none';
        }

        // Add confetti effect or celebration
        this.cameras.main.flash(2000, 255, 215, 0);
    }

    update(): void {
        // No continuous updates needed for this game
    }

    shutdown(): void {
        // Clean up event listeners
        this.submitButton?.removeEventListener('click', () => this.checkAnswer());
        this.skipButton?.removeEventListener('click', () => this.skipQuestion());

        this.time.removeAllEvents();
    }
}
