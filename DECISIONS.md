# Decisions

Judgement calls where the spec was silent or where we deviated.

## Design system — v3 premium dark glass (not truck art)

The spec described an "Indian truck art" aesthetic. During design review, this was rejected as too niche and unpolished. The approved design is a premium dark glass UI:

- Dark background (#08080C) with translucent glass surfaces
- Amber (#F0A030) primary, coral (#FF6B6B) danger, violet (#A78BFA) accent
- Plus Jakarta Sans + DM Sans typography (not Baloo 2 + Karla)
- Soft colored shadows and ambient glows instead of hard ink shadows
- No ornamental borders, decorative elements, or truck art motifs

## Multi-select word packs

The spec implied single pack selection. Changed to multi-select with an "All" shortcut and a count indicator. Mixed pack (`__mixed__`) samples across all selected packs.

## Imposter hint setting

Added a three-tier configurable imposter hint in Settings:
- **None** — imposter sees nothing
- **Category** — imposter sees the pack category (e.g., "Food")
- **Category + hint** — imposter sees category plus a contextual hint

Default is "Category" (matches spec's "give the imposter the category" toggle but extends it).

## Font loading via @expo-google-fonts

Spec said to bundle fonts locally. Using `@expo-google-fonts/plus-jakarta-sans` and `@expo-google-fonts/dm-sans` instead — these bundle the font files in the app binary (no network fetch at runtime), meeting the airplane mode requirement while being simpler to manage.

## Store persistence

Using zustand persist with AsyncStorage. `lastOutcome` (round result) is transient — not persisted across app kills. Roster, scores, settings, and selected packs are persisted.

## Brand name: KUHAK

Updated from the spec's placeholder "BAHROOP" to final brand name "KUHAK" per BRAND-KUHAK.md. Package name set to `com.kuhak.game`.
