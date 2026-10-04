# DoYouKnow design system (redesign branch)

Visual redesign only: features, data, Supabase calls, state and game/streak
logic are untouched. Mobile only (375-430 px). Dark only.

## Audit of the previous UI (generic patterns found)

- Emojis used as icons: tab bar (🏠🤝⭐), top bar (＋ 📥), status chips (✅⏳❗❌), streak (🔥 text).
- Light/dark switch with a flat grey/white look; no point of view.
- System font only, one weight (800) used for everything bold.
- Pink→purple gradient button (the "AI gradient"), stamps with rotated bordered text (Tinder clone look).
- Edge-to-edge bottom tab bar with hairline border, emoji + tiny label.
- "Frage 1 von 5" caption for progress; plain text-pill answer buttons.
- Dashed "add" card, uniform 16 px padding everywhere, no hierarchy.
- Opaque backgrounds on every screen, no atmosphere.

## Tokens (`src/constants/theme.ts`)

| Token | Value | Use |
|---|---|---|
| background | `#07070B` | base behind the field |
| backgroundElement | `#14141A` | cards, list rows |
| backgroundSelected | `#1D1D26` | pressed, chips, inactive progress |
| border | `#24242E` | hairlines |
| text / textSecondary | `#F5F5F7` / `#8D8D9B` | neutral text only |
| primary | `#7B6CFF` | the single accent: active tab, primary action, progress |
| success / danger | `#3DDC97` / `#FF5470` | semantic only (yes/no) |
| FieldColors | blue `#2F6BFF` → violet `#8A5CFF` | contour lines in the background only |

**Rule:** blue→violet appears in the background field and as the one accent.
Surfaces and text stay neutral.

**Type:** Bricolage Grotesque (display: titles, question text, topic names) +
Inter (body, labels). `FontFamily` in theme.ts; loaded in `src/app/_layout.tsx`.
Scale: title 44/48, subtitle 28/33, question 32/37, body 16/24, small 14/20, caption 12/16.

**Spacing:** 4 / 8 / 16 / 24 / 32 / 64 (`Spacing`). **Radii:** card 24-28, pill 999, chip 12 (`Radius`).

**Icons:** one family, Ionicons (`@expo/vector-icons`). No emojis as UI icons.
(User avatars and topic icons are user/content data and stay emoji for now.)

## Background looks per tab (`src/constants/field-variants.ts`)

| Tab | Look |
|---|---|
| Heute | blue/violet, soft "water" (halo around the lines) |
| Match | red, crisp thin topographic lines |
| Favoriten | teal/blue water |
| Profil | magenta/violet lines |

Stack screens keep the look of the tab they were opened from; switching tabs
cross-fades the colours/density over 700 ms. Intensity is deliberately low (~0.35).

## Shared building blocks

`Screen` (title + scrolling column), `GroupedCard` / `GroupedListItem` (rounded card of rows with
hairline dividers), `ListRow`, `Avatar`, `SmallButton`, `IconButton`, `EmptyState`, `ScoreHero`,
`SectionLabel`, `AnswerChip`, `PrimaryButton` (solid accent pill), `SecondaryButton` (outlined pill),
`TextField`. New screens should be built from these, not from raw views.

## Components

- `FieldBackground` (`field-background.tsx`, `.web.tsx`, `field-canvas.tsx`): Skia
  contour-line shader, driven by a Reanimated frame clock on the UI thread. One
  instance in the root layout behind every screen (navigation theme and
  `ThemedView` are transparent). Pauses when unfocused / app backgrounded;
  frozen frame when Reduce Motion is on. Web loads CanvasKit from
  `public/canvaskit.wasm`.
- `FloatingTabBar`: floating pill, active tab = filled accent pill with label.
- `AnswerButtons`: round icon buttons with label underneath, "Ja" in accent.
- `SwipeDeck` progress: 5 segment bars instead of a caption.
- `GuessHeader`: story-style avatar ring, "Du rätst für X", topic as hero title.

## Previewing without a login

Dev only: `/design-preview/{guess,home,match,favorites,profile}` (redirect away outside `__DEV__`) render
the screens with fake data. Screenshots for review: Playwright at 393×852 against
`npx expo start --port 8081` (web).

## Status

- [x] Tokens, fonts, icon family, background, tab bar, guess screen (card, buttons, header)
- [x] Home (top bar, hero card, grouped friends), Profil (one-line header), Match + Favoriten (restyled)
- [x] Auth (welcome, intro, login, register, forgot password), guess/overview/result screens
- [x] Friends, add-friend, friend-requests, settings (+ all subpages), safety, match detail, privacy policy
- [ ] Open: on-device check in Expo Go, a11y pass (VoiceOver/Dynamic Type), Pages export check
