import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MultiplicationTableScene } from '../MultiplicationTableScene';
import Phaser from 'phaser';

describe('MultiplicationTableScene', () => {
    let scene: MultiplicationTableScene;

    beforeEach(() => {
        // Create a mock game container
        const container = document.createElement('div');
        container.id = 'game-container';
        document.body.appendChild(container);

        // Create the scene
        scene = new MultiplicationTableScene();

        // Mock Phaser game and systems
        scene.game = {
            config: {},
        } as Phaser.Game;

        scene.sys = {
            events: new Phaser.Events.EventEmitter(),
        } as Phaser.Scenes.Systems;

        scene.time = {
            delayedCall: vi.fn(),
            removeAllEvents: vi.fn(),
        } as unknown as Phaser.Time.Clock;

        scene.cameras = {
            main: {
                flash: vi.fn(),
            },
        } as unknown as Phaser.Cameras.Scene2D.CameraManager;
    });

    it('should create without crashing', () => {
        expect(() => scene.preload()).not.toThrow();
        expect(() => scene.create()).not.toThrow();
    });

    it('should initialize discovered set as empty', () => {
        scene.create();
        expect(scene['discovered']).toBeDefined();
        expect(scene['discovered'].size).toBe(0);
    });

    it('should create DOM elements on create', () => {
        scene.create();

        const questionElement = document.getElementById('question');
        const answerInput = document.getElementById('answer-input');
        const multiplicationTable = document.getElementById('multiplication-table');

        expect(questionElement).toBeTruthy();
        expect(answerInput).toBeTruthy();
        expect(multiplicationTable).toBeTruthy();
    });

    it('should create 10x10 multiplication table cells', () => {
        scene.create();

        const multiplicationTable = document.getElementById('multiplication-table');
        expect(multiplicationTable).toBeTruthy();

        // Should have 11x11 cells (including headers)
        // 1 corner + 10 column headers + 10 row headers + 100 data cells = 121 cells
        const cells = multiplicationTable?.getElementsByClassName('table-cell');
        expect(cells?.length).toBe(121);
    });

    it('should create cells with correct data attributes', () => {
        scene.create();

        const cell = document.getElementById('cell-5-6');
        expect(cell).toBeTruthy();
        expect(cell?.dataset.row).toBe('5');
        expect(cell?.dataset.col).toBe('6');
        expect(cell?.dataset.answer).toBe('30');
    });

    it('should have all cells initially undiscovered', () => {
        scene.create();

        for (let row = 1; row <= 10; row++) {
            for (let col = 1; col <= 10; col++) {
                const cell = document.getElementById(`cell-${row}-${col}`);
                expect(cell?.classList.contains('undiscovered')).toBe(true);
                expect(cell?.classList.contains('discovered')).toBe(false);
            }
        }
    });

    it('should ask a question on create', () => {
        scene.create();

        const questionElement = document.getElementById('question');
        expect(questionElement?.textContent).toContain('Vad är');
        expect(questionElement?.textContent).toContain('×');
    });

    it('should have a current question after create', () => {
        scene.create();

        expect(scene['currentQuestion']).toBeDefined();
        expect(scene['currentQuestion']?.num1).toBeGreaterThanOrEqual(1);
        expect(scene['currentQuestion']?.num1).toBeLessThanOrEqual(10);
        expect(scene['currentQuestion']?.num2).toBeGreaterThanOrEqual(1);
        expect(scene['currentQuestion']?.num2).toBeLessThanOrEqual(10);
    });

    it('should update without errors', () => {
        scene.create();
        expect(() => scene.update()).not.toThrow();
    });

    it('should clean up on shutdown', () => {
        scene.create();
        const removeAllEventsMock = vi.fn();
        scene.time.removeAllEvents = removeAllEventsMock;

        expect(() => scene.shutdown()).not.toThrow();
        expect(removeAllEventsMock).toHaveBeenCalled();
    });

    it('should have submit and skip buttons', () => {
        scene.create();

        const submitButton = document.getElementById('submit-btn');
        const skipButton = document.getElementById('skip-btn');

        expect(submitButton).toBeTruthy();
        expect(skipButton).toBeTruthy();
        expect(submitButton?.textContent).toBe('Svara');
        expect(skipButton?.textContent).toBe('Hoppa över');
    });

    it('should display progress at 0% initially', () => {
        scene.create();

        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        expect(progressFill?.style.width).toBe('0%');
        expect(progressText?.textContent).toBe('0 av 100 upptäckta');
    });

    it('should mark cell as discovered when revealed', () => {
        scene.create();

        // Reveal a specific cell
        scene['revealCell'](5, 6);

        const cell = document.getElementById('cell-5-6');
        expect(cell?.classList.contains('discovered')).toBe(true);
        expect(cell?.classList.contains('undiscovered')).toBe(false);
        expect(scene['discovered'].has('5-6')).toBe(true);
    });

    it('should update progress when cells are discovered', () => {
        scene.create();

        // Reveal 10 cells (10% of 100)
        for (let i = 1; i <= 10; i++) {
            scene['revealCell'](1, i);
        }

        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        expect(progressFill?.style.width).toBe('10%');
        expect(progressText?.textContent).toBe('10 av 100 upptäckta');
    });
});
