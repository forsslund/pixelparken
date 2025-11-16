# Pixelparken – Product Requirements Document (PRD)

## 1. Översikt
**Pixelparken** är en reklamfri, webbläsarbaserad spelsuite för barn i åldern 8–10 år. Plattformen kombinerar pedagogiska spel (t.ex. "lär dig klockan") med nöjesspel som Tetris, memory och små pussel. Allt är icke‑kommersiellt och riktar sig till barn, föräldrar och skolor som vill ha roliga och trygga digitala upplevelser.

Den första versionen (“First Slice”) lanseras utan backend/inloggning och körs helt lokalt i webbläsaren.

---

## 2. Syfte & mål
### 2.1 Syfte
Att skapa en säker, enkel och engagerande spelplattform för barn där lärande och lek samexisterar. Plattformen ska vara lätt att bygga vidare på, modulär och AI‑vänlig i utvecklingen.

### 2.2 Mål
1. **Lansera en fungerande MVP** med 2–3 minispel.
2. Skapa en teknisk bas som gör det enkelt att lägga till nya spel via AI‑genererad kod.
3. Erbjuda en trygg och reklamfri miljö.
4. Skapa en enhetlig grafisk stil och UI‑upplevelse som känns rolig för målgruppen.
5. Plattformen ska fungera på:
   - iPad
   - Chromebook
   - PC/Mac
   - Mobil (portrait + landscape)

---

## 3. Målgrupp
- Barn 8–10 år
- Föräldrar som vill ha trygg digital underhållning
- Lärare och fritidshem
- Ideella föreningar som vill visa och vidareutveckla pedagogiska spel

---

## 4. Scope för First Slice (v0.1)
### 4.1 Funktioner som ingår
- En launcher som listar alla minispel.
- Tre minispel:
  - **Tetris** (nöje)
  - **Lär dig klockan** (pedagogik)
  - **Memory** (nöje)
- Lokal highscore via `localStorage`.
- Enhetlig UI‑designguide.
- Modulär kodstruktur för lätt utbyggnad.

### 4.2 Funktioner som *inte* ingår ännu
- Inloggning
- Backend
- Moln-highscore
- Avatarer
- Sociala funktioner

---

## 5. Filarkitektur
Pixelparkens struktur är optimerad för modulär utveckling, AI‑generering och enkel utbyggnad.

```
pixelparken/
  index.html (laddar launchern)
  vite.config.js
  package.json

  /src
    /launcher
      Launcher.ts
      LauncherView.ts

    /games
      /tetris
        main.ts
        assets/
      /klockan
        main.ts
        assets/
      /memory
        main.ts
        assets/

    /common
      ui.ts
      sound.ts
      utils.ts
      styles.css

  /public
    logo.svg
    icons/
    shared-assets/

  /dist (genereras av Vite)
```

### Designprinciper för struktur
- Varje spel är helt isolerat.
- Importbara komponents (UI, ljud, utils) ligger i `/common`.
- Launcher bygger automatiskt en spellista genom att importera `games/*`.

---

## 6. Tech Stack (för First Slice)
### 6.1 Frontend
- **Vite** – projektstruktur & bundler
- **TypeScript** – stabilitet & AI‑vänlig kodgenerering
- **Phaser 3** – spelmotor
- **CSS (ev. Tailwind i v0.2)**
- Ingen backend
- Lokal lagring via `localStorage`

### 6.2 Targetplattformar
- Webbläsare (Chrome, Edge, Safari, Firefox)
- iPadOS & Android tablets
- ChromeOS (skolan)

### 6.3 Prestandamål
- Laddtid < 1 sekund på modern iPad
- 60 FPS på enkla 2D‑spel

---

## 7. Stilguide
En enhetlig, barnvänlig och färgglad stil.

### 7.1 Färgpalett
- **Primärblå:** #3A78FF
- **Lekfull gul:** #FFD93A
- **Mjuk grön:** #74D680
- **Aqua:** #47C5FF
- **Rosa accent:** #FF7DD1
- **Neutral vit:** #FFFFFF
- **Neutral mörk:** #1A1A1A

### 7.2 Typografi
- **Rubriker:** "Fredoka One" eller "Baloo 2"
- **Brödtext:** "Nunito" eller "Inter"
- Stora knappar med tydliga bokstäver

### 7.3 UI-komponenter
- Rundade hörn (12–20px)
- Stora hit‑targets
- Tydliga ikoner i SVG
- Primärknapp: blå bakgrund, vit text
- Sekundärknapp: vit bakgrund, blå kant

### 7.4 Ikonstil
- Simpla, platta illustrationer
- Tydliga konturer
- Färre detaljer – mer färgblock
- SVG-format för enkel skalning

### 7.5 Ljud
- Lätta och vänliga ljudeffekter:
  - "pling"
  - "coin"
  - "success"
  - "try again"

### 7.6 Bildstil
- 2D-grafik
- Färgglatt och lekfullt
- Maximal läsbarhet på iPad & Chromebook

---

## 8. Risker & Mitigering
| Risk | Mitigering |
|------|------------|
| För många olika stilar i spelen | Gemensam stilguide + UI-komponentbibliotek |
| Prestandaproblem | Phaser + optimerade assets + Vite bundling |
| För hög teknisk komplexitet | Små, isolerade spel |
| För mycket att bygga | AI-generering + modulär struktur |

---

## 9. Roadmap
### v0.1 – First Slice (1–2 veckor)
- UI‑designguide
- Launcher
- Tetris
- Klockan‑spelet
- Memory
- Grundläggande UI‑bibliotek

### v0.2
- Avatarer
- Badge‑system
- Global highscore (lokalt)

### v0.3
- Backend & konton
- Synkade profiler

---

## 10. Definition of Done
- Launcher fungerar och listar spel
- Minst två spel spelbara
- Alla spel följer stilguiden
- 60 FPS på iPad
- Deployad via GitHub Pages eller Netlify

---

**Detta PRD utgör grunden för Pixelparkens utveckling och iterationer.**

