# Kuhak — कुहक

> Everyone gets the word. One of you gets nothing.

An offline, pass-the-phone imposter word game for Indian groups. Five friends, one phone, no internet.

## Quick start

```bash
npm install
npx expo start
npm test
```

## Build

```bash
eas build -p android --profile preview   # internal APK
eas build -p android --profile production # AAB for Play Store
```

## Project structure

```
src/
├── brand.ts          # single source for app name — edit here to rename
├── game/
│   ├── types.ts      # shared type definitions
│   ├── logic.ts      # pure game functions (dealRoles, resolveVote, etc.)
│   └── logic.test.ts # jest tests for game logic
├── content/          # 8 word packs (320 entries total)
├── i18n/             # en.ts, hi.ts (placeholder), t() function
├── theme/tokens.ts   # color, spacing, font, radius tokens
├── store/index.ts    # zustand + persist state management
└── components/
    └── CatchSlam.tsx  # catch-moment overlay animation

app/
├── _layout.tsx       # root: fonts, orientation lock, keep-awake
├── index.tsx         # home screen
├── roster.tsx        # player list
├── setup.tsx         # round config (packs, timer, imposters)
├── play.tsx          # deal → discuss → vote → guess (4 phases)
├── result.tsx        # outcome + scores
├── settings.tsx      # sound, haptics, timer, hint config
└── about.tsx         # origin story
```

## Rename checklist

The app name lives in `src/brand.ts`. If renaming:

1. `src/brand.ts` — update all BRAND fields
2. `app.json` — name, slug, scheme, android.package, ios.bundleIdentifier
3. `package.json` — name field
4. Icon assets — adaptive-icon.png, icon.png
5. Privacy policy URL in brand.ts

**Do not upload to Play Console until the package name is final.** It is permanent on first upload.
