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

## 📱 Android

There are two ways to get Mochi on your phone:

**1. Native app (APK).** Every push builds an APK with GitHub Actions
(`.github/workflows/android.yml`).
- Any branch: open the run under the **Actions** tab and download the `Mochi-apk` artifact (a zip with `Mochi.apk` inside).
- `main` (or a manual "Run workflow"): the APK is published to
  [Releases](../../releases/latest), downloadable straight from your phone.

Open `Mochi.apk` on your phone to install it. Android will ask you to allow installs
from your browser/file manager the first time. It's a debug-signed build, so it's for
sideloading, not the Play Store.

The app lives in `android/`: a tiny Java WebView wrapper with no dependencies.
The web files at the repo root get copied into the APK on every build, so there's
only one copy of the game. To build locally (needs the Android SDK):

```sh
cd android && ./gradlew assembleDebug
# -> android/app/build/outputs/apk/debug/app-debug.apk
```

**2. Install from the browser (PWA).** Host the repo on GitHub Pages, open it in
Chrome on Android, then tap ⋮ → **Add to Home screen** / **Install app**. It works offline.
