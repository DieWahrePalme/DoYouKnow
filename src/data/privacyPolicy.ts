/**
 * Privacy policy text - shown in the app and on the public /privacy page
 * (needed before signup and as the App Store privacy URL).
 *
 * DRAFT: the [[...]] placeholders must be filled in, and the text should be
 * checked (e.g. with a generator like datenschutz-generator.de or a lawyer)
 * before a public release. It describes what the app actually stores today.
 */
export const PRIVACY_CONTACT = {
  name: '[[Name der verantwortlichen Person]]',
  email: '[[Kontakt-E-Mail]]',
  supabaseRegion: '[[Region des Supabase-Projekts, z. B. EU (Frankfurt)]]',
};

export const PRIVACY_POLICY_UPDATED = '[[Datum]]';

export interface PrivacySection {
  title: string;
  body: string;
}

export const PRIVACY_POLICY: PrivacySection[] = [
  {
    title: 'Verantwortlich',
    body: `Verantwortlich für die Datenverarbeitung in „Do You Know?“ ist ${PRIVACY_CONTACT.name}, erreichbar unter ${PRIVACY_CONTACT.email}.`,
  },
  {
    title: 'Welche Daten wir speichern',
    body:
      '• Konto: E-Mail-Adresse und Passwort (nur verschlüsselt gespeichert), Benutzername, Profilbild (Emoji).\n' +
      '• Spiel: deine Antworten auf die Tageskarten mit Zeitpunkt, deine Tipps über Freunde, welche Karte du an welchem Tag hattest.\n' +
      '• Soziales: Freundschaften und Anfragen, Favoriten, von dir blockierte Personen und von dir gesendete Meldungen.\n' +
      '• Push: ein Geräte-Token, falls du Benachrichtigungen erlaubst.\n' +
      '• Bei der Registrierung: deine Bestätigung, mindestens 16 Jahre alt zu sein, und deine Zustimmung zu dieser Erklärung (mit Zeitpunkt).',
  },
  {
    title: 'Wozu und auf welcher Grundlage',
    body:
      'Wir verarbeiten diese Daten, um dir das Spiel bereitzustellen – Konto, tägliche Karten, Auflösungen, Flammen und Freunde (Art. 6 Abs. 1 lit. b DSGVO). ' +
      'Push-Benachrichtigungen schicken wir nur, wenn du sie erlaubst (Art. 6 Abs. 1 lit. a DSGVO); du kannst sie jederzeit in den Einstellungen deines Geräts abschalten. ' +
      'Meldungen und Blockierungen nutzen wir, um die App sicher zu halten (Art. 6 Abs. 1 lit. f DSGVO).',
  },
  {
    title: 'Wer deine Daten sieht',
    body:
      'Deine Antworten sehen nur Personen, deren Freundschaftsanfrage du angenommen hast (oder die deine angenommen haben) – damit sie raten und ihre Auflösung sehen können. ' +
      'Benutzername und Profilbild sind für alle angemeldeten Nutzer sichtbar, damit man dich als Freund finden kann. ' +
      'Wen du blockierst oder meldest, erfährt die betroffene Person nicht. Wir verkaufen keine Daten, zeigen keine Werbung und nutzen kein Tracking.',
  },
  {
    title: 'Dienstleister',
    body:
      `• Supabase (Datenbank, Anmeldung), Serverstandort: ${PRIVACY_CONTACT.supabaseRegion}.\n` +
      '• Expo / 650 Industries, Inc. (USA) – leitet Push-Benachrichtigungen an Apple bzw. Google weiter; dafür wird dein Geräte-Token übermittelt.\n' +
      '• GitHub, Inc. (USA) – stellt die Web-Version bereit; dabei fallen technisch notwendige Server-Logs (z. B. IP-Adresse) an.\n' +
      'Übermittlungen in die USA erfolgen auf Grundlage des EU-US Data Privacy Framework bzw. von Standardvertragsklauseln.',
  },
  {
    title: 'Speicherdauer und Löschen',
    body:
      'Wir speichern deine Daten, solange dein Konto besteht. Unter Einstellungen → Datenschutz & Konto → „Konto löschen“ kannst du dein Konto jederzeit selbst löschen – ' +
      'dabei werden alle oben genannten Daten sofort und endgültig entfernt.',
  },
  {
    title: 'Mindestalter',
    body: 'Die App ist ab 16 Jahren. Bei der Registrierung bestätigst du, dass du mindestens 16 bist.',
  },
  {
    title: 'Deine Rechte',
    body:
      'Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie darauf, eine Einwilligung jederzeit zu widerrufen. ' +
      `Schreib dafür an ${PRIVACY_CONTACT.email}. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren.`,
  },
];
