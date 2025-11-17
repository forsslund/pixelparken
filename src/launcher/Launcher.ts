import { GameInfo } from '../common/ui';

/**
 * Launcher class - manages the game selection screen
 */
export class Launcher {
  private games: GameInfo[];

  constructor() {
    this.games = [
      {
        id: 'klockan',
        name: 'Lär dig klockan',
        description: 'Öva på att läsa av klockan och lär dig tider!',
        category: 'educational',
        icon: '🕐',
        path: './games/klockan/index.html',
      },
      {
        id: 'tangent',
        name: 'Tangentträning',
        description: 'Lär dig skriva snabbt och korrekt på tangentbordet!',
        category: 'educational',
        icon: '⌨️',
        path: './games/tangent/index.html',
      },
      {
        id: 'tetris',
        name: 'Tetris',
        description: 'Stapla blocken och rensa rader!',
        category: 'fun',
        icon: '🎮',
        path: './games/tetris/index.html',
      },
      // More games will be added here in future versions
      // {
      //   id: 'memory',
      //   name: 'Memory',
      //   description: 'Hitta alla par av kort!',
      //   category: 'fun',
      //   icon: '🃏',
      //   path: './games/memory/index.html',
      // },
    ];
  }

  getGames(): GameInfo[] {
    return this.games;
  }

  getGamesByCategory(category: 'educational' | 'fun'): GameInfo[] {
    return this.games.filter(game => game.category === category);
  }
}
