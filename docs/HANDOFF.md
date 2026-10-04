# Handoff – DoYouKnow

_Updated: 4 Oct 2026 (end of the redesign session)_

## Branches
- **`ios-app`** (current, local = origin, at `c74a54e`): working branch for the iPhone app. Contains everything below.
- **`claude/social-game-swipe-mvp-0dukax`** = "main". Pushes to it deploy the web build to **https://app.playdoyouknow.com** (PR #6 moved the site to the domain root, `GH_PAGES_BASE_PATH` removed). PR #7 merged `ios-app` into it, so the web build has the redesign.
- Local/remote `redesign`, `light-mode`, `marketing-previews` are deleted. Nothing unmerged or uncommitted except this file.
- Web is only for visual checks (Playwright at 393×852); the product is the iPhone app (Expo SDK 57, Supabase, EAS).

## Done this session (PRs #4, #5, #7)
- **Full visual redesign**: tokens/fonts (Bricolage Grotesque + Inter), Ionicons, shared components (`Screen`, `GroupedCard`, `ListRow`, `SmallButton`, `EmptyState`, …). See `docs/DESIGN-SYSTEM.md`.
- **Animated Skia background** (contour lines), different look per tab, simpler/calmer version, pauses when unfocused, static with Reduce Motion.
- **Swipe deck**: stack of cards with "N übrig" counter, card promoted in place (no remount), slower exit, haptics, VoiceOver custom actions.
- **Real mounted tabs** (`expo-router` Tabs) with floating pill bar; Profil shows a skeleton then a virtualized grid. Navigator fade/freeze removed (suspected cause of a blank-tab bug seen on device).
- **Light theme + Settings → Darstellung (System/Hell/Dunkel)**, saved in AsyncStorage (`src/state/appearanceStore.ts`); default follows the system.
- **Accessibility pass** (contrast, Dynamic Type caps, labels, hit targets).
- Dev-only preview routes `src/app/design-preview/*` (fake data, no login) – redirect away outside `__DEV__`.
- Backend/push/deletion/report-block/privacy policy from earlier work are in place (`supabase/schema.sql` deployed, Expo push via pg_cron).

## Untested / in progress
- **Nothing tried on the iPhone since the redesign**: swipe feel and haptics, tab switching (blank-tab bug could not be reproduced on web), Profil load, light mode, VoiceOver and Larger Text, Skia in a production build.
- Landing-page screenshots exist in `~/Programming/doyouknow-screenshots/` (outside the repo; seed code was discarded).
- A dev server may still run from this session: `npx expo start --port 8081`.

## Next steps (most important first)
1. **Sign-up emails**: Supabase's built-in mail is very limited (likely team addresses only) → set up custom SMTP (Resend/Brevo) and test confirm + reset links.
2. **Privacy contact email** in `src/data/privacyPolicy.ts` is still the placeholder `doyouknow.app@gmail.com` → change to `support@playdoyouknow.com` (domain + iCloud mail are live).
3. **Two demo accounts** (confirmed, already friends, some answers) for Apple's Beta App Review notes.
4. **Hide "Heute zurücksetzen"** (and other test tools) outside dev builds.
5. **Real app icon + splash** (`assets/expo.icon` is the Expo default; splash colour `#208AEF`).
6. **Supabase redirect URLs**: remove `exp://**`, keep `doyouknow://**`, add the web domain.
7. **Security review of RLS** in `supabase/schema.sql` (answers readable only by accepted friends).
8. `app.json`: `ITSAppUsesNonExemptEncryption`, check `expo-notifications` for production, APNs key via EAS.
9. Crash reporting (Sentry) before friends use it; decide on analytics and update the privacy policy.
10. Apple Developer account → `eas build --platform ios --profile production` → `eas submit` → TestFlight external group (public link) + Beta App Review.
11. Test on a real device: email links, push (reminder: `select public.send_streak_reminders(true);`), account deletion on real Supabase.
12. Before a public App Store release: Impressum, legal check of the privacy policy, remove test tools.

## Open questions
- Raw answers readable by friends via API (needed for results/match) – acceptable long-term? (PRD open question)
- 16+ is only enforced in the app, not server-side.
- Supabase plan: free projects pause after inactivity and have no backups – upgrade before the friends test?
- Is the Apple Developer account active yet?
