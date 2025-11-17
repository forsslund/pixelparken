import Phaser from 'phaser';
import { MultiplicationTableScene } from './MultiplicationTableScene';
import './multiplication-table.css';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1,
    height: 1,
    parent: 'game-container',
    transparent: true,
    scene: [MultiplicationTableScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0, x: 0 },
            debug: false
        }
    }
};

const game = new Phaser.Game(config);

export default game;
