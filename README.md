# 🎨 Pixelparken

En reklamfri, webbläsarbaserad spelsuite för barn i åldern 8–10 år.

## Översikt

Pixelparken kombinerar pedagogiska spel med nöjesspel i en trygg, icke-kommersiell miljö. Den första versionen (v0.1) körs helt lokalt i webbläsaren utan backend eller inloggning.

## Installera och köra

```bash
# Installera dependencies
npm install

# Starta dev-servern
npm run dev

# Bygg för produktion
npm run build

# Förhandsgranska produktionsbygget
npm run preview
```

Dev-servern startar på http://localhost:3000

## Spel som ingår (v0.1)

- **🕐 Lär dig klockan** - Pedagogiskt spel där barn övar på att läsa av analog klocka

## Kommande spel

- Tetris
- Memory
- Fler pedagogiska spel

## Teknisk stack

- **Vite** - Byggverktyg
- **TypeScript** - Typsäkerhet
- **Phaser 3** - Spelmotor
- **localStorage** - Lokal highscore

## Struktur

```
pixelparken/
  /src
    /launcher         # Huvudmenyn
    /games           # Alla minispel
      /klockan       # Klockspelet
    /common          # Delade komponenter
  /public            # Statiska filer
```

## Licens

Non-profit open source projekt
