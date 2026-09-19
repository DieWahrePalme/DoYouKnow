# Do You Know?

Social-Guessing-Game: Jeden Tag beantwortest du 5 Fragen über dich selbst.
Deine Freunde raten per Swipe, wie du geantwortet hast – und du rätst
umgekehrt über sie. Sobald beide Seiten (deine Wahrheit + die Vermutung)
vorliegen, gibt's die sofortige Auflösung. Passiert das täglich, wächst der
Flame-Streak der Freundschaft.

Aktueller Stand: **MVP mit lokalem Mock-State** (kein Backend, kein Login).
Alle Daten leben nur im Arbeitsspeicher der App und sind nach einem Neustart
wieder auf dem Ausgangszustand – ideal, um den Kern-Loop zu testen, bevor
Supabase (Auth, echte Freunde, Realtime) angebunden wird.

## Starten (Browser)

```bash
npm install
npm run web
```

Öffnet die App unter `http://localhost:8081`.

## Starten (Handy, ohne Mac/PC-Build)

```bash
npx expo start
```

QR-Code mit der [Expo Go](https://expo.dev/go) App auf dem Handy scannen –
Live-Reload inklusive.

## Struktur

- `src/app/index.tsx` – Startbildschirm: "Du" oben angepinnt + Freundesliste
  mit Flame-Streak und Sanduhr (⏳ = wartet auf eine Auflösung).
- `src/app/me.tsx` – deine eigenen 5 Fragen des Tages (die "Wahrheit").
- `src/app/friend/[id].tsx` – Swipe-Deck, um die 5 Fragen über einen Freund
  zu raten, danach Auflösung oder Warte-Zustand.
- `src/components/swipe-card.tsx` / `swipe-deck.tsx` – Gesten-Mechanik
  (links = Nein, rechts = Ja, hoch = eher Ja, runter = eher Nein) inklusive
  Tap-Buttons als Fallback.
- `src/state/appStore.ts` – Zustand-Store mit dem gesamten Tages-Zustand
  (Wahrheiten, Vermutungen, Streak-Logik).
- `src/data/mockData.ts` – Platzhalter-Freunde, Themen-Decks und
  Beispiel-Antworten zum Ausprobieren.

## Nächste Schritte

- Supabase anbinden (Auth, echte Freundschaften, tägliche Deck-Rotation,
  Realtime-Auflösung statt Mock-State).
- Push-Benachrichtigung, sobald eine Auflösung freigeschaltet wird.
- App-Store-Release über [EAS Build](https://docs.expo.dev/build/introduction/)
  (funktioniert cloud-seitig, ganz ohne Mac).
