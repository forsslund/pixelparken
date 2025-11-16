import Phaser from 'phaser';

type PieceType = 'king' | 'rook';
type PieceColor = 'white' | 'black';

interface Piece {
  type: PieceType;
  color: PieceColor;
  row: number;
  col: number;
  sprite?: Phaser.GameObjects.Text;
}

interface Position {
  row: number;
  col: number;
}

export class ChessGame extends Phaser.Scene {
  private boardSize = 8;
  private squareSize = 70;
  private boardOffsetX = 30;
  private boardOffsetY = 30;
  private pieces: Piece[] = [];
  private selectedPiece?: Piece;
  private highlightSquares: Phaser.GameObjects.Rectangle[] = [];
  private isPlayerTurn = true;
  private whiteKing?: Piece;
  private whiteRook?: Piece;
  private blackKing?: Piece;
  private checkSquare?: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'ChessGame' });
  }

  create(): void {
    // Draw the chessboard
    this.drawBoard();

    // Initialize pieces (King and Rook vs King endgame)
    this.initializePieces();

    // Add instructions
    this.add.text(600, 50, 'Sätt matt!\n\nVit: Kung + Torn\nSvart: Kung', {
      fontSize: '18px',
      color: '#FFFFFF',
      fontFamily: 'Nunito',
      align: 'center',
    }).setOrigin(0.5);

    // Add reset button
    const resetBtn = this.add.rectangle(600, 520, 140, 50, 0x3A78FF);
    resetBtn.setInteractive({ useHandCursor: true });
    this.add.text(600, 520, 'Nytt Spel', {
      fontSize: '18px',
      color: '#FFFFFF',
      fontFamily: 'Nunito',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    resetBtn.on('pointerdown', () => {
      this.resetGame();
    });

    resetBtn.on('pointerover', () => {
      resetBtn.setFillStyle(0x2858CF);
    });

    resetBtn.on('pointerout', () => {
      resetBtn.setFillStyle(0x3A78FF);
    });

    this.updateGameStatus('Din tur - Flytta vit pjäs');
  }

  private drawBoard(): void {
    const lightColor = 0xF0D9B5;
    const darkColor = 0xB58863;

    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const x = this.boardOffsetX + col * this.squareSize;
        const y = this.boardOffsetY + row * this.squareSize;
        const color = (row + col) % 2 === 0 ? lightColor : darkColor;

        const square = this.add.rectangle(
          x + this.squareSize / 2,
          y + this.squareSize / 2,
          this.squareSize,
          this.squareSize,
          color
        );

        square.setInteractive({ useHandCursor: true });
        square.on('pointerdown', () => {
          this.handleSquareClick(row, col);
        });
      }
    }

    // Add board coordinates
    const coordColor = '#FFFFFF';
    const coordSize = '16px';

    // Column labels (a-h)
    for (let col = 0; col < this.boardSize; col++) {
      const label = String.fromCharCode(97 + col); // a-h
      this.add.text(
        this.boardOffsetX + col * this.squareSize + this.squareSize / 2,
        this.boardOffsetY + this.boardSize * this.squareSize + 10,
        label,
        {
          fontSize: coordSize,
          color: coordColor,
          fontFamily: 'Nunito',
        }
      ).setOrigin(0.5, 0);
    }

    // Row labels (8-1)
    for (let row = 0; row < this.boardSize; row++) {
      this.add.text(
        this.boardOffsetX - 15,
        this.boardOffsetY + row * this.squareSize + this.squareSize / 2,
        (8 - row).toString(),
        {
          fontSize: coordSize,
          color: coordColor,
          fontFamily: 'Nunito',
        }
      ).setOrigin(0.5);
    }
  }

  private initializePieces(): void {
    this.pieces = [];

    // White King (player) - starting position e1
    this.whiteKing = {
      type: 'king',
      color: 'white',
      row: 7,
      col: 4,
    };
    this.pieces.push(this.whiteKing);

    // White Rook (player) - starting position h1
    this.whiteRook = {
      type: 'rook',
      color: 'white',
      row: 7,
      col: 7,
    };
    this.pieces.push(this.whiteRook);

    // Black King (opponent) - starting position e8
    this.blackKing = {
      type: 'king',
      color: 'black',
      row: 0,
      col: 4,
    };
    this.pieces.push(this.blackKing);

    // Draw all pieces
    this.pieces.forEach(piece => {
      this.drawPiece(piece);
    });
  }

  private drawPiece(piece: Piece): void {
    const x = this.boardOffsetX + piece.col * this.squareSize + this.squareSize / 2;
    const y = this.boardOffsetY + piece.row * this.squareSize + this.squareSize / 2;

    // Unicode chess symbols
    const symbols = {
      white: {
        king: '♔',
        rook: '♖',
      },
      black: {
        king: '♚',
        rook: '♜',
      },
    };

    const symbol = symbols[piece.color][piece.type];
    piece.sprite = this.add.text(x, y, symbol, {
      fontSize: '52px',
      color: piece.color === 'white' ? '#FFFFFF' : '#000000',
    }).setOrigin(0.5);

    // Add shadow for better visibility
    piece.sprite.setStroke('#000000', piece.color === 'white' ? 2 : 0);
    piece.sprite.setShadow(2, 2, '#000000', 2, true, true);
  }

  private handleSquareClick(row: number, col: number): void {
    if (!this.isPlayerTurn) {
      return;
    }

    // Check if clicking on own piece
    const clickedPiece = this.pieces.find(
      p => p.row === row && p.col === col && p.color === 'white'
    );

    if (clickedPiece) {
      // Select this piece
      this.selectPiece(clickedPiece);
    } else if (this.selectedPiece) {
      // Try to move selected piece
      this.tryMovePiece(this.selectedPiece, row, col);
    }
  }

  private selectPiece(piece: Piece): void {
    this.selectedPiece = piece;
    this.clearHighlights();

    // Highlight valid moves
    const validMoves = this.getValidMoves(piece);
    validMoves.forEach(pos => {
      const x = this.boardOffsetX + pos.col * this.squareSize + this.squareSize / 2;
      const y = this.boardOffsetY + pos.row * this.squareSize + this.squareSize / 2;

      const highlight = this.add.rectangle(
        x,
        y,
        this.squareSize,
        this.squareSize,
        0xFFD93A,
        0.4
      );
      this.highlightSquares.push(highlight);
    });

    // Highlight selected piece
    const x = this.boardOffsetX + piece.col * this.squareSize + this.squareSize / 2;
    const y = this.boardOffsetY + piece.row * this.squareSize + this.squareSize / 2;
    const selectedHighlight = this.add.rectangle(
      x,
      y,
      this.squareSize,
      this.squareSize,
      0x74D680,
      0.5
    );
    this.highlightSquares.push(selectedHighlight);
  }

  private clearHighlights(): void {
    this.highlightSquares.forEach(h => h.destroy());
    this.highlightSquares = [];
  }

  private getValidMoves(piece: Piece): Position[] {
    const moves: Position[] = [];

    if (piece.type === 'king') {
      // King moves one square in any direction
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];

      for (const [dr, dc] of directions) {
        const newRow = piece.row + dr;
        const newCol = piece.col + dc;

        if (this.isValidPosition(newRow, newCol)) {
          const targetPiece = this.getPieceAt(newRow, newCol);
          // Can't capture own pieces
          if (!targetPiece || targetPiece.color !== piece.color) {
            // Check if this move would put king in check
            if (!this.wouldBeInCheck(piece, newRow, newCol)) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        }
      }
    } else if (piece.type === 'rook') {
      // Rook moves horizontally or vertically
      const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
      ];

      for (const [dr, dc] of directions) {
        let newRow = piece.row + dr;
        let newCol = piece.col + dc;

        while (this.isValidPosition(newRow, newCol)) {
          const targetPiece = this.getPieceAt(newRow, newCol);

          if (!targetPiece) {
            // Empty square - valid move
            moves.push({ row: newRow, col: newCol });
          } else if (targetPiece.color !== piece.color) {
            // Enemy piece - can capture
            moves.push({ row: newRow, col: newCol });
            break; // Can't move past this piece
          } else {
            // Own piece - can't move here or past it
            break;
          }

          newRow += dr;
          newCol += dc;
        }
      }
    }

    return moves;
  }

  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
  }

  private getPieceAt(row: number, col: number): Piece | undefined {
    return this.pieces.find(p => p.row === row && p.col === col);
  }

  private wouldBeInCheck(piece: Piece, newRow: number, newCol: number): boolean {
    if (piece.type !== 'king') {
      return false;
    }

    // Check if any enemy piece can attack this position
    const enemyPieces = this.pieces.filter(p => p.color !== piece.color);

    for (const enemy of enemyPieces) {
      if (enemy.type === 'king') {
        // Check if enemy king is adjacent
        const rowDiff = Math.abs(enemy.row - newRow);
        const colDiff = Math.abs(enemy.col - newCol);
        if (rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0)) {
          return true; // Kings can't be adjacent
        }
      } else if (enemy.type === 'rook') {
        // Check if rook can attack this position
        if (enemy.row === newRow || enemy.col === newCol) {
          // Check if path is clear
          const rowDir = enemy.row === newRow ? 0 : (newRow - enemy.row) / Math.abs(newRow - enemy.row);
          const colDir = enemy.col === newCol ? 0 : (newCol - enemy.col) / Math.abs(newCol - enemy.col);

          let checkRow = enemy.row + rowDir;
          let checkCol = enemy.col + colDir;

          while (checkRow !== newRow || checkCol !== newCol) {
            if (this.getPieceAt(checkRow, checkCol)) {
              return false; // Path is blocked
            }
            checkRow += rowDir;
            checkCol += colDir;
          }

          return true; // Rook can attack this position
        }
      }
    }

    return false;
  }

  private tryMovePiece(piece: Piece, newRow: number, newCol: number): void {
    const validMoves = this.getValidMoves(piece);
    const isValid = validMoves.some(m => m.row === newRow && m.col === newCol);

    if (!isValid) {
      this.clearHighlights();
      this.selectedPiece = undefined;
      return;
    }

    // Check if capturing a piece
    const capturedPiece = this.getPieceAt(newRow, newCol);
    if (capturedPiece) {
      capturedPiece.sprite?.destroy();
      this.pieces = this.pieces.filter(p => p !== capturedPiece);
    }

    // Move the piece
    piece.row = newRow;
    piece.col = newCol;

    // Update sprite position
    const x = this.boardOffsetX + piece.col * this.squareSize + this.squareSize / 2;
    const y = this.boardOffsetY + piece.row * this.squareSize + this.squareSize / 2;
    piece.sprite?.setPosition(x, y);

    this.clearHighlights();
    this.selectedPiece = undefined;

    // Check for checkmate
    if (this.isCheckmate('black')) {
      this.updateGameStatus('Schackmatt! Du vann!');
      this.isPlayerTurn = false;
      this.showVictoryMessage();
      return;
    }

    // Switch turns
    this.isPlayerTurn = false;
    this.updateGameStatus('Motståndaren tänker...');

    // AI moves after delay
    this.time.delayedCall(500, () => {
      this.makeAIMove();
    });
  }

  private makeAIMove(): void {
    if (!this.blackKing) {
      return;
    }

    // Simple AI: Move king away from rook and white king
    const validMoves = this.getValidMoves(this.blackKing);

    if (validMoves.length === 0) {
      // No valid moves - stalemate or checkmate
      return;
    }

    // Pick a move that maximizes distance from white king
    let bestMove = validMoves[0];
    let bestScore = -1000;

    for (const move of validMoves) {
      let score = 0;

      // Prefer moves away from white king
      if (this.whiteKing) {
        const distToWhiteKing = Math.abs(move.row - this.whiteKing.row) +
                               Math.abs(move.col - this.whiteKing.col);
        score += distToWhiteKing * 10;
      }

      // Prefer moves away from rook
      if (this.whiteRook) {
        const distToRook = Math.abs(move.row - this.whiteRook.row) +
                          Math.abs(move.col - this.whiteRook.col);
        score += distToRook * 5;
      }

      // Prefer moves toward center (to avoid corners early)
      const distToCenter = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
      score -= distToCenter * 2;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    // Move black king
    this.blackKing.row = bestMove.row;
    this.blackKing.col = bestMove.col;

    const x = this.boardOffsetX + this.blackKing.col * this.squareSize + this.squareSize / 2;
    const y = this.boardOffsetY + this.blackKing.row * this.squareSize + this.squareSize / 2;
    this.blackKing.sprite?.setPosition(x, y);

    // Check if black king is in check
    if (this.isInCheck(this.blackKing)) {
      this.showCheckIndicator(this.blackKing);
      this.updateGameStatus('Schack! Din tur');
    } else {
      this.updateGameStatus('Din tur - Flytta vit pjäs');
    }

    this.isPlayerTurn = true;
  }

  private isInCheck(king: Piece): boolean {
    const enemyPieces = this.pieces.filter(p => p.color !== king.color);

    for (const enemy of enemyPieces) {
      if (enemy.type === 'rook') {
        if (enemy.row === king.row || enemy.col === king.col) {
          // Check if path is clear
          const rowDir = enemy.row === king.row ? 0 : (king.row - enemy.row) / Math.abs(king.row - enemy.row);
          const colDir = enemy.col === king.col ? 0 : (king.col - enemy.col) / Math.abs(king.col - enemy.col);

          let checkRow = enemy.row + rowDir;
          let checkCol = enemy.col + colDir;

          while (checkRow !== king.row || checkCol !== king.col) {
            if (this.getPieceAt(checkRow, checkCol)) {
              return false; // Path is blocked
            }
            checkRow += rowDir;
            checkCol += colDir;
          }

          return true; // Rook attacks king
        }
      }
    }

    return false;
  }

  private isCheckmate(color: PieceColor): boolean {
    const king = this.pieces.find(p => p.color === color && p.type === 'king');
    if (!king) {
      return false;
    }

    // Check if king is in check
    const inCheck = this.isInCheck(king);

    // Get all valid moves for the king
    const validMoves = this.getValidMoves(king);

    // If in check and no valid moves, it's checkmate
    // If not in check and no valid moves, it's stalemate
    return inCheck && validMoves.length === 0;
  }

  private showCheckIndicator(king: Piece): void {
    // Remove old check indicator
    this.checkSquare?.destroy();

    // Show red highlight on king in check
    const x = this.boardOffsetX + king.col * this.squareSize + this.squareSize / 2;
    const y = this.boardOffsetY + king.row * this.squareSize + this.squareSize / 2;

    this.checkSquare = this.add.rectangle(
      x,
      y,
      this.squareSize,
      this.squareSize,
      0xFF0000,
      0.4
    );
  }

  private showVictoryMessage(): void {
    const bg = this.add.rectangle(400, 300, 500, 200, 0x000000, 0.8);
    const text = this.add.text(400, 280, 'Grattis!', {
      fontSize: '48px',
      color: '#74D680',
      fontFamily: 'Fredoka One',
    }).setOrigin(0.5);

    const subText = this.add.text(400, 330, 'Du satte matt!', {
      fontSize: '24px',
      color: '#FFFFFF',
      fontFamily: 'Nunito',
    }).setOrigin(0.5);

    // Animate
    this.tweens.add({
      targets: [bg, text, subText],
      alpha: { from: 0, to: 1 },
      duration: 500,
    });
  }

  private resetGame(): void {
    // Remove old check indicator
    this.checkSquare?.destroy();

    // Clear all pieces
    this.pieces.forEach(p => p.sprite?.destroy());
    this.clearHighlights();

    // Reinitialize
    this.isPlayerTurn = true;
    this.selectedPiece = undefined;
    this.initializePieces();
    this.updateGameStatus('Din tur - Flytta vit pjäs');
  }

  private updateGameStatus(status: string): void {
    if (window.updateGameStatus) {
      window.updateGameStatus(status);
    }
  }
}
