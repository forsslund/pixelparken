# Claude Development Guidelines for Pixelparken

This document provides guidelines for AI-assisted development on the Pixelparken project.

## 🎯 Definition of Done

Before marking any task as "complete", you **MUST** run and pass ALL of the following:

```bash
npm run validate
```

This command runs:
1. ✅ **TypeScript type checking** (`tsc --noEmit`)
2. ✅ **ESLint** (code quality & style)
3. ✅ **Vitest** (unit tests, headless)

**NEVER** consider a task done without running these checks. If any fail, fix the issues before proceeding.

---

## 🔧 TypeScript Guidelines

### Strict Mode Requirements
- `strictNullChecks` is **enabled** - always handle `null` and `undefined` explicitly
- `strictPropertyInitialization` is **enabled** - initialize all class properties

### Non-null Assertions (`!`) are DISCOURAGED
❌ **Bad:**
```typescript
private myText!: Phaser.GameObjects.Text;

create() {
    this.doSomething(); // Uses myText
    this.myText = this.add.text(...); // Initialized AFTER use
}
```

✅ **Good:**
```typescript
private myText?: Phaser.GameObjects.Text;

create() {
    this.myText = this.add.text(...);
    this.doSomething(); // Uses myText after initialization
}

private doSomething() {
    if (this.myText) {
        this.myText.setText('hello');
    }
}
```

### Optional Chaining
Use `?.` for properties that might be undefined:
```typescript
this.player?.setVelocity(100, 0);
```

---

## 🎮 Phaser 3 Specific Guidelines

### Scene Lifecycle Order
**ALWAYS** respect this order in scenes:

1. **`preload()`** - Load assets (images, audio, etc.)
2. **`create()`** - Create game objects, initialize variables
3. **`update()`** - Game loop logic (called every frame)

### Common Pitfalls to Avoid

#### 1. Using properties before initialization
❌ **Bad:**
```typescript
create() {
    this.generateLevel(); // Calls method that uses this.player
    this.player = this.physics.add.sprite(...); // Too late!
}
```

✅ **Good:**
```typescript
create() {
    this.player = this.physics.add.sprite(...);
    this.generateLevel(); // Now safe to use this.player
}
```

#### 2. Not cleaning up on scene shutdown
❌ **Bad:**
```typescript
// Scene switches without cleanup
this.scene.start('NextScene');
```

✅ **Good:**
```typescript
shutdown() {
    // Clean up timers, tweens, event listeners
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.input.off('pointerdown');
}
```

#### 3. Memory leaks from event listeners
❌ **Bad:**
```typescript
create() {
    this.input.on('pointerdown', () => {
        // Handler never removed
    });
}
```

✅ **Good:**
```typescript
create() {
    this.input.on('pointerdown', this.handleClick, this);
}

shutdown() {
    this.input.off('pointerdown', this.handleClick, this);
}
```

#### 4. Starting scenes too quickly
If scenes don't render properly, ensure:
- The previous scene has a `preload()` function (even if empty)
- Or wrap `scene.start()` in a small delay:
```typescript
this.time.delayedCall(10, () => {
    this.scene.start('NextScene');
});
```

#### 5. Accessing game objects before they exist
Always check if objects exist in `update()`:
```typescript
update() {
    if (this.player && this.enemy) {
        this.physics.overlap(this.player, this.enemy);
    }
}
```

---

## 🧪 Testing Requirements

### What to Test
Every game scene should have tests for:

1. **Lifecycle methods don't crash**
   - `preload()` runs without errors
   - `create()` runs without errors
   - `update()` runs without errors

2. **Properties are initialized**
   - No `undefined` access errors
   - All game objects created properly

3. **Memory management**
   - `shutdown()` or `destroy()` methods clean up properly

4. **Game logic (where applicable)**
   - Score calculations
   - Win/lose conditions
   - User input handling

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure Example
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MyScene } from './MyScene';

describe('MyScene', () => {
    let scene: MyScene;

    beforeEach(() => {
        scene = new MyScene();
    });

    it('should create without crashing', () => {
        expect(() => scene.create()).not.toThrow();
    });

    it('should initialize all required properties', () => {
        scene.create();
        expect(scene.player).toBeDefined();
        expect(scene.score).toBe(0);
    });
});
```

---

## 🎨 Code Style

### ESLint Rules
The project uses ESLint with TypeScript support. Key rules:

- **No unused variables** - Remove or prefix with `_`
- **Prefer const** - Use `const` over `let` when possible
- **No console.log** - Use proper logging or remove debug statements
- **Consistent naming** - PascalCase for classes, camelCase for variables

### Auto-fix
```bash
# Fix auto-fixable issues
npm run lint:fix
```

---

## 📦 Adding New Games

When adding a new game to Pixelparken:

1. Create folder: `src/games/[game-name]/`
2. Create files:
   - `main.ts` - Entry point
   - `[GameName].ts` - Main scene class
   - `[game-name].css` - Styles
   - `index.html` - HTML entry
3. Add to `vite.config.js` rollup inputs
4. Update launcher: `src/launcher/Launcher.ts`
5. **Write tests**: `src/games/[game-name]/__tests__/[GameName].test.ts`
6. Run `npm run validate` before committing

---

## 🚀 Development Workflow

### Before Starting Work
```bash
npm install       # Ensure dependencies are up to date
npm run dev       # Start dev server
```

### During Development
- Make changes
- Test in browser (http://localhost:3000)
- Write/update tests as you go

### Before Marking Task Complete
```bash
npm run validate  # MUST pass before "done"
```

### If Validation Fails
1. Read error messages carefully
2. Fix TypeScript errors first
3. Fix ESLint warnings
4. Fix failing tests
5. Re-run `npm run validate`
6. Repeat until all checks pass

---

## 🐛 Debugging Tips

### Phaser HEADLESS Mode
Tests run in HEADLESS mode, which means:
- No rendering (canvas exists but doesn't draw)
- Physics still works
- Audio is mocked
- Use for testing game logic, not visuals

### Common Test Errors
- **"Cannot read property of undefined"** → Check initialization order
- **"Canvas getContext not implemented"** → Ensure vitest-canvas-mock is set up
- **"Module did not self-register"** → Check `threads: false` in vitest.config.ts

---

## 📚 Resources

- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Phaser Scene Lifecycle](https://photonstorm.github.io/phaser3-docs/Phaser.Scenes.ScenePlugin.html)
- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## ✅ Final Checklist

Before completing ANY task:

- [ ] Code follows TypeScript strict mode
- [ ] No ESLint errors or warnings
- [ ] All tests pass
- [ ] `npm run validate` passes
- [ ] Tested manually in browser
- [ ] No console.log statements left behind
- [ ] Memory cleanup (if applicable)

**Remember: Quality over speed. A working, tested feature is better than a broken "complete" one.**
