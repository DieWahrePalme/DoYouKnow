# Do You Know?

Social-Guessing-Game: Jeden Tag bekommst du ein eigenes Thema mit 5 Fragen über
dich selbst. Deine Freunde raten per Swipe, wie du geantwortet hast – und du
rätst umgekehrt über sie. Sobald beide Seiten (deine Wahrheit + die Vermutung)
vorliegen, gibt's die Auflösung. Spielt ihr beide jeden Tag, wächst der
Flame-Streak eurer Freundschaft.

Produktvision, Zielgruppe und MVP-Umfang: **[docs/PRD.md](docs/PRD.md)**.

Aktueller Stand: **MVP-Prototyp mit Supabase-Backend** (Login, echte Freunde,
Datenbank mit Row Level Security). Läuft als Web-App auf GitHub Pages; die
iOS-App ist in Arbeit.

## Setup

```bash
npm install
cp .env.example .env   # Supabase-URL + anon key eintragen (Dashboard → Settings → API)
```

Die Datenbank-Struktur liegt in `supabase/schema.sql`.

## Starten

```bash
npm run web       # Browser, http://localhost:8081
npm run ios       # iOS-Simulator (Xcode nötig)
npx expo start    # QR-Code mit Expo Go auf dem Handy scannen
```

## Struktur

- `src/app/(auth)/` – Willkommen, Login, Registrierung, Passwort vergessen.
- `src/app/(tabs)/` – Haupt-Tabs: Heute (`index.tsx`), Match, Favoriten, Profil.
- `src/app/friend/[id]/` – Swipe-Deck, um die Fragen über einen Freund zu
  raten, danach Auflösung oder Warte-Zustand.
- `src/app/match/[friendId]/` – Gemeinsamkeiten mit einem Freund.
- `src/app/friends.tsx`, `add-friend.tsx`, `friend-requests.tsx` –
  Freundesliste und Anfragen per Benutzername.
- `src/app/settings/` – Profil-Einstellungen (Avatar, Benutzername, Passwort,
  Privatsphäre).
- `src/components/swipe-card.tsx` / `swipe-deck.tsx` – Gesten-Mechanik
  (links = Nein, rechts = Ja, hoch = eher Ja, runter = eher Nein) inklusive
  Tap-Buttons als Fallback.
- `src/state/` – Zustand-Stores: `authStore` (Login/Profil), `friendsStore`
  (Freundschaften), `appStore` (Tages-Zustand, Streak-Logik).
- `src/lib/supabase.ts` – Supabase-Client inkl. sicherem Session-Speicher auf
  dem Handy.
- `src/data/mockData.ts` – Fragen-Decks und Beispieldaten.

## Deployment

Jeder Push auf den Haupt-Branch baut die Web-Version und veröffentlicht sie
auf GitHub Pages (`.github/workflows/deploy-pages.yml`). Die Supabase-Keys
kommen dort aus den GitHub-Secrets.

## Nächste Schritte

Siehe [docs/PRD.md](docs/PRD.md) → "MVP scope". Kurzfassung:

- iOS-App über TestFlight an Freunde verteilen.
- Push-Benachrichtigungen (Auflösung fertig, Streak läuft um 22:00 ab).
- Melden/Blockieren und Account-Löschung (App-Store-Pflicht).
