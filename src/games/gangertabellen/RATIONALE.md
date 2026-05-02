# Gångertabellen — pedagogisk rationale

Detta dokument beskriver de pedagogiska avvägningarna bakom delspelet
*Gångertabellen* i Pixelparken. Syftet är att motivera varför spelet är
designat som det är, så att framtida förändringar görs medvetet och inte
av misstag bryter den underliggande inlärningsmodellen.

## Mål

Automatisera multiplikationsfakta 1×1 till 10×10 så att eleven kan svara
*flytande* (utan att räkna ut svaret) — typiskt under 1.5 sekunder per
uppgift. Förståelsen för vad multiplikation *är* förutsätts; spelet
drillar bara återkallning.

## Designprinciper

### 1. Errorless input (felfri inmatning)
Spelaren kan inte skriva fel. Endast den förväntade siffran registreras
i svaret; andra tangenter ger en kort visuell signal men påverkar inte
svaret. Spelet går vidare automatiskt så fort sista siffran är korrekt
skriven — ingen Enter behövs.

**Varför:** Bygger på Skinners *errorless learning* (1950-tal) och
används i moderna typing-tutors och Suzuki-inspirerade musikappar. Att
felaktiga svarsmönster aldrig "tränas in" minskar konsolidering av fel,
och det håller flödet igång utan irriterande dialoger.

**Konsekvens i koden:** Tangentbordshanteraren matchar varje keystroke
mot förväntad nästa siffra i svaret. Vid miss räknas felet i statistiken
men `currentAnswer` förlängs inte. Inget "ge upp"-kommando finns.

### 2. Spaced repetition / Leitner-box
Varje fakta (t.ex. 4×3) har en "låda" 0–5. Korrekt och snabbt svar →
flytta upp en låda. Fel → flytta ner en låda. Lådans nivå påverkar hur
ofta fakta kommer tillbaka.

**Varför:** Ren slumpning ger oproportionerligt mycket tid åt fakta som
redan är bemästrade. Leitner-systemet (Sebastian Leitner, 1972) och
SM-2-algoritmen (Piotr Woźniak, 1985) har gång på gång visat
överlägsenhet jämfört med oplanerad repetition. För 55 unika fakta är
en enkel Leitner-implementation tillräcklig — vi behöver inte SM-2:s
intervallberäkningar eftersom vi inte planerar dagar utan minuter inom
en session.

**Konsekvens i koden:** `scheduler.ts` ger varje fakta en vikt baserad
på (a) box-nivå, (b) genomsnittlig responstid, (c) felfrekvens, och
(d) tid sedan senast sedd (för att undvika omedelbara upprepningar).
Nya fakta får hög vikt så att de introduceras tidigt.

### 3. Kommutativitet
4×3 och 3×4 räknas som *samma* fakta i statistiken. Vid presentation
slumpas ordningen så eleven ser båda formerna.

**Varför:** Två olika facklog för samma underliggande fakta dubblar
inlärningstiden. Eleven behöver känna igen produkten oavsett ordning,
men minnet är ett.

**Konsekvens i koden:** `canonicalKey(a, b)` normaliserar alltid mindre
faktorn först. Internt finns 55 fakta (10+9+8+...+1), inte 100.

### 4. Fluency-mått, inte bara korrekthet
"Bemästrad" definieras som *flera korrekta svar i rad under en
flytgräns* (just nu 3 sekunder), inte bara ett rätt svar.

**Varför:** Precision teaching (Lindsley, 1960-tal) skiljer mellan
*accuracy* och *fluency*. Långsamma rätt-svar betyder att eleven
fortfarande räknar ut svaret — det är inte automatiserat. Endast
flytande återkallning överlever stress, glömska och att man tänker på
annat samtidigt.

**Konsekvens i koden:** Box-nivån höjs bara om responstiden är under
`FLUENCY_MS`. Lägre tröskel = striktare bemästring.

### 5. Synlig progression
En 10×10-värmekarta visar status för alla fakta i realtid. Färg
kodar bemästringsnivå.

**Varför:** Synlig progression är en av de starkaste motivationsfaktorerna
för repetitiv övning. Eleven ser exakt vilka fakta som återstår.

## Medvetna avgränsningar (för MVP)

Följande är *inte* implementerat, men har övervägts och valts bort
medvetet:

- **Mjuk felrespons (variant 4 i diskussionen):** Helt blockerad
  inmatning kan kännas "död". Vi börjar med ren errorless och utvärderar
  om flödet känns för stumt.
- **Multi-användarprofil:** Statistik sparas lokalt per webbläsare. Inga
  konton.
- **Adaptiv introduktion:** Alla 55 fakta är aktiva från start. Vi
  introducerar inte tabell för tabell. Viktningen av nya fakta sköter
  stegvis introduktion ändå.
- **SM-2 / dagsbaserade intervall:** Sessionerna är korta nog att
  Leitner inom-session räcker.

## Risker att vara uppmärksam på

- **Mattångest:** Tidsbaserad drill kan skapa stress hos elever som
  inte redan förstår multiplikation. Detta spel är *inte* ett
  introduktionsverktyg — det är ett automatiseringsverktyg. Om elever
  med svag grundförståelse använder det utan handledning kan stressen
  skada motivationen.
- **Rote utan transfer:** Memorering utan tillämpning glöms snabbt.
  Spelet förutsätter att eleven också möter multiplikation i andra
  sammanhang.

## Referenser

- Skinner, B. F. (1958). *Teaching Machines.*
- Leitner, S. (1972). *So lernt man lernen.*
- Lindsley, O. R. (1990). *Precision teaching: By teachers for
  children.*
- Boaler, J. (2014). *Fluency Without Fear.* (Varning för tidsbaserad
  drill utan förståelse.)
