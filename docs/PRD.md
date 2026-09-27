# DoYouKnow – Product Requirements (PRD)

_Status: v1.0 · Owner: Moritz · Last updated: 2026-09-27_

## 1. Vision

A daily ritual with friends: answer questions about yourself, guess how your
friends answered, and over time see how you and your friends change.

DoYouKnow keeps friendships (and colleague relationships) alive through a small
daily exchange — and builds a personal history of how you think.

## 2. Target users

- Friend groups and couples who want a light daily touchpoint
- Colleagues / teams (later, via groups)
- Age group: **16–30** (growing up, getting to know each other — similar to
  Instagram's core audience). 16+ avoids the parental-consent requirement of
  German/EU data-protection law (GDPR).

Inspiration: LinkedIn daily games (daily habit), Snapchat (streaks/flames),
Duolingo (streak pressure, subscription tiers), dating apps (swipe input).
Look & feel: Snapchat, Spotify, Revolut, Instagram.

## 3. Core loop (daily)

1. **Every user gets their own topic of the day** (e.g. Moritz: sports,
   Tom: family, Const: motorsport) — topics are mixed per user.
2. A topic card has **5 questions**.
3. **You answer your own card** (your "truth"). Questions can be answered in
   advance on your profile; a pre-answered card counts as done for the day
   (you can keep or change the answer).
4. **You guess each friend's card** by swiping.
5. When both truth and guess exist, the **result is revealed** (how well you
   know each other).

### Answer format
Dating-style swipe cards — intuitive and habit-forming:
- right = yes · left = no · up = rather yes · down = rather no
- Tap buttons as fallback.
- _Answer scale may be revisited later; keep as-is for now._

### Streak (flames)
- One streak per friendship (like Snapchat).
- The streak goes +1 for a day **only when all four are done**: I answered my
  own card, Tom answered his, I guessed Tom's, Tom guessed mine.
- Miss a day → the streak with that friend is lost (Duolingo-style pressure).
- **Day boundary:** midnight **Europe/Berlin** for everyone.
- **Streak reminder:** push notification ~2 hours before midnight (22:00
  Berlin) if a streak with a friend is at risk ("2 hours left — keep your
  🔥 with Tom").

### Content
- At least **365 questions/topics** — a full year without repeats.
- Questions come back after ~1 year to feed **History**.

## 4. App areas

| Tab | Purpose |
|---|---|
| **Today** | Own card + friends' cards to guess, flames, pending results |
| **Match** | Where your *own* answers overlap with a friend's own answers (e.g. both like climbing) → profile similarity score |
| **Favorites** | Save a match that matters and share it with the friend via external share (WhatsApp etc.): "we both like climbing — let's go?" |
| **History** | Compare your answers over time (e.g. burgers → berries; more family-focused than last year) — for you and your friends |

### Privacy of answers
- Friends **cannot browse your raw answers** on your profile — otherwise
  guessing would be trivial (just look it up).
- Answers are only revealed **through results and matches**, e.g. "Family:
  4/5 match, here's the difference".
- _To revisit after MVP: matches still leak raw answers indirectly._

## 5. Friends

- **MVP:** add by username → friend request → accept (Instagram/Snapchat model).
- **Later:** invite link → play once as guest → must create an account to continue.

## 6. Groups (later — not MVP)

- Create groups with friends/colleagues; the **group** gets a topic.
- **Mode A – "How similar are we?":** everyone answers about themselves; the
  group sees how it matches.
- **Mode B – "Who knows X best?":** one member is highlighted, everyone
  guesses their answers → scoreboard. Playable more than once a day (party mode).

## 7. Platforms

- **iOS** (native app) + **Web** (browser, GitHub Pages) — one Expo / React
  Native codebase
- Android: possible later from the same codebase, not planned for MVP

## 8. Business model (later)

- **100% free** during MVP and early versions. Billing comes last.
- Planned: Duolingo-style subscription with 3 tiers — **Starter / Medium / Pro**.
- Free tier idea: **10 guessing cards per day** (≈ 2 friends); paid tiers unlock
  unlimited play, unlimited groups, etc. _Exact limits open._

## 9. MVP scope

**Goal:** a test version for Moritz's friends — installable on their own
phones, shareable, used daily — to collect real usage data. Public App Store
release comes after that; no fixed date yet.

**Distribution:** iOS via TestFlight (public invite link; Apple Developer
account, $99/year — approved). Everyone else uses the web version.

**In** _(confirmed)_
- Account + login (Supabase)
- Friends via username request
- Daily topic card (5 questions), own answers + guessing via swipe
- Result reveal
- Per-friend streak
- Match tab
- Push notifications: result ready, streak at risk (22:00 Berlin)

**Out (later)**
- Favorites sharing, History tab (needs ~1 year of data anyway)
- Invite links + guest play
- Groups (both modes)
- Subscriptions / payments

**Required anyway (App Store rules for social apps):** report + block users,
account deletion in-app, privacy policy.

## 10. Open questions

1. Privacy: is revealing raw answers through matches acceptable long-term?
2. Answer scale: keep yes / no / rather yes / rather no, or simplify?
3. Timeline: no fixed date yet — set one once the iOS build runs on devices.
