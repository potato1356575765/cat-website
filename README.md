# 🐱 Mochi: Pocket Cat

A tiny virtual pet cat that lives in your browser. Keep them fed, entertained, rested, and clean, and level them up.

## Features

- **Hand-drawn CSS cat**: blinks, breathes, wags their tail, and their eyes follow your cursor
- **4 stats** (hunger, fun, energy, cleanliness) that drain over time, even while you're away
- **Feed** 🐟, **Laser** 🔴 (a mini-game: click the red dot to catch it), **Nap** 😴, **Bath** 🛁
- **Pet the cat** by clicking them for hearts + purrs
- XP and levels, and you can rename your cat
- Day/night sky based on your local time
- Synthesized meows/purrs via Web Audio (no sound files)
- Progress saves automatically in `localStorage`

## Run it

No build step. Just open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

Works great on GitHub Pages too.
