import { AnswerMap, AnswerValue, Friend, HistoryMap, Profile, QuestionGroup } from '@/types';

const GROUP_DEFS: { id: string; name: string; icon: string; questions: string[] }[] = [
  {
    id: 'urlaub',
    name: 'Urlaub',
    icon: '🏖️',
    questions: [
      'Ich würde spontan für ein Wochenende ins Ausland fliegen.',
      'Ich bevorzuge Meer statt Berge.',
      'Ich würde lieber campen als im Hotel übernachten.',
      'Ich packe meinen Koffer erst am Abreisetag.',
      'Ich probiere im Urlaub am liebsten lokales Essen statt Bekanntem.',
    ],
  },
  {
    id: 'sport',
    name: 'Sport',
    icon: '🏃',
    questions: [
      'Ich treibe mindestens dreimal die Woche Sport.',
      'Ich würde lieber einen Marathon laufen als Gewichte heben.',
      'Ich schaue mir lieber Sport im Fernsehen an, als ihn selbst zu machen.',
      'Ich würde einem Team-Sport einen Einzelsport vorziehen.',
      'Ich stehe für ein Training früh vor der Arbeit auf.',
    ],
  },
  {
    id: 'essen',
    name: 'Essen',
    icon: '🍔',
    questions: [
      'Ich koche lieber selbst, als essen zu gehen.',
      'Ich würde exotisches Essen probieren, ohne vorher zu wissen was drin ist.',
      'Süßes ist mir wichtiger als Herzhaftes.',
      'Ich könnte auf Fleisch komplett verzichten.',
      'Scharfes Essen mag ich richtig gerne.',
    ],
  },
  {
    id: 'freizeit',
    name: 'Freizeit',
    icon: '🎮',
    questions: [
      'Ich verbringe einen freien Abend lieber allein als in Gesellschaft.',
      'Ich würde ein neues Hobby völlig spontan starten.',
      'Ich lese lieber ein Buch als einen Film zu schauen.',
      'Ich bin eher der Morgenmensch als der Nachtmensch.',
      'Ich würde ein ganzes Wochenende ohne Handy verbringen können.',
    ],
  },
  {
    id: 'zukunft',
    name: 'Zukunft & Familie',
    icon: '🔮',
    questions: [
      'Ich könnte mir vorstellen, bald eine Familie zu gründen.',
      'Ich habe schon einen konkreten Plan für die nächsten 5 Jahre.',
      'Ich würde lieber mein eigenes Ding starten, als angestellt zu bleiben.',
      'Geld ist mir wichtiger als viel Freizeit.',
      'Ich könnte mir vorstellen, für immer an einem Ort zu bleiben.',
    ],
  },
  // --- Essen im Detail ---
  {
    id: 'pasta',
    name: 'Pasta & Nudelgerichte',
    icon: '🍝',
    questions: [
      'Ich esse Pasta mindestens einmal die Woche.',
      'Ich bevorzuge cremige Saucen wie Carbonara statt Tomatensauce.',
      'Ich würde selbst gemachte Pasta einer Fertigpackung vorziehen.',
      'Extra Käse gehört für mich immer dazu.',
      'Ich probiere gerne ungewöhnliche Nudelgerichte aus anderen Ländern.',
    ],
  },
  {
    id: 'pizza',
    name: 'Pizza',
    icon: '🍕',
    questions: [
      'Ich bestelle mindestens einmal im Monat Pizza.',
      'Ananas gehört für mich auf eine Pizza.',
      'Ich mag dünnen Boden lieber als dicken.',
      'Ich würde eine komplett vegane Pizza bestellen.',
      'Für mich muss der Käserand extra gefüllt sein.',
    ],
  },
  {
    id: 'burger',
    name: 'Burger & Fast Food',
    icon: '🍔',
    questions: [
      'Ich esse mindestens einmal im Monat Fast Food.',
      'Ein selbstgemachter Burger schmeckt mir besser als einer vom Imbiss.',
      'Ich bestelle immer extra Pommes dazu.',
      'Ich würde einen veganen Burger genauso gerne essen wie einen mit Fleisch.',
      'Ich achte beim Fast Food auf Kalorien.',
    ],
  },
  {
    id: 'suess',
    name: 'Süßigkeiten & Desserts',
    icon: '🍰',
    questions: [
      'Ich brauche nach dem Essen fast immer etwas Süßes.',
      'Schokolade ist für mich das beste Dessert.',
      'Ich würde ein Dessert einer Vorspeise vorziehen.',
      'Ich backe gerne selbst.',
      'Ich könnte komplett auf Zucker verzichten.',
    ],
  },
  {
    id: 'kaffee',
    name: 'Kaffee & Tee',
    icon: '☕',
    questions: [
      'Ich brauche morgens Kaffee, um wach zu werden.',
      'Ich trinke lieber Tee als Kaffee.',
      'Ich würde für guten Kaffee mehr Geld ausgeben.',
      'Ich trinke meinen Kaffee schwarz, ohne Milch oder Zucker.',
      'Ich könnte einen Tag ganz ohne Koffein auskommen.',
    ],
  },
  {
    id: 'fruehstueck',
    name: 'Frühstück',
    icon: '🥐',
    questions: [
      'Ich frühstücke jeden Tag.',
      'Herzhaftes Frühstück ist mir lieber als süßes.',
      'Ich nehme mir morgens Zeit zum Frühstücken statt es zu überspringen.',
      'Ich würde am liebsten jeden Tag Frühstücken gehen statt zuhause zu essen.',
      'Ohne Frühstück fühle ich mich den ganzen Tag schlapp.',
    ],
  },
  {
    id: 'kochen',
    name: 'Kochen zuhause',
    icon: '🍳',
    questions: [
      'Ich koche mindestens dreimal die Woche selbst.',
      'Ich probiere gerne neue Rezepte aus.',
      'Ich würde lieber für Freunde kochen als essen zu gehen.',
      'Ich plane meine Mahlzeiten im Voraus.',
      'Kochen ist für mich eher Stress als Entspannung.',
    ],
  },
  {
    id: 'veggie',
    name: 'Vegan & Vegetarisch',
    icon: '🥦',
    questions: [
      'Ich reduziere bewusst meinen Fleischkonsum.',
      'Ich könnte mir vorstellen, komplett vegan zu leben.',
      'Ich finde pflanzliche Alternativen genauso lecker wie das Original.',
      'Der Umweltaspekt beeinflusst meine Essensentscheidungen.',
      'Ich würde für ein rein veganes Restaurant extra Umwege in Kauf nehmen.',
    ],
  },
  {
    id: 'streetfood',
    name: 'Street Food & Snacks',
    icon: '🌮',
    questions: [
      'Ich probiere auf Reisen gerne Street Food statt Restaurants.',
      'Tacos oder Wraps gehören zu meinen Lieblingsgerichten.',
      'Ich würde von einem Food Truck genauso gerne essen wie in einem Restaurant.',
      'Scharfe Snacks mag ich besonders gerne.',
      'Ich nasche zwischendurch, auch wenn ich nicht hungrig bin.',
    ],
  },
  {
    id: 'alkohol',
    name: 'Alkohol & Cocktails',
    icon: '🍹',
    questions: [
      'Ich trinke regelmäßig am Wochenende Alkohol.',
      'Ich mag Cocktails lieber als Bier oder Wein.',
      'Ich könnte komplett auf Alkohol verzichten, ohne es zu vermissen.',
      'Auf Partys trinke ich meistens mit.',
      'Ich probiere gerne neue Cocktail-Rezepte aus.',
    ],
  },
  // --- Finanzen & Zukunft ---
  {
    id: 'investieren',
    name: 'Investieren & Aktien',
    icon: '📈',
    questions: [
      'Ich investiere regelmäßig einen Teil meines Einkommens.',
      'Ich würde eher in Aktien als in Gold investieren.',
      'Ich informiere mich aktiv über Finanzthemen.',
      'Risiko schreckt mich bei Geldanlagen nicht ab.',
      'Ich würde lieber langfristig als kurzfristig investieren.',
    ],
  },
  {
    id: 'sparen',
    name: 'Sparen & Budget',
    icon: '💰',
    questions: [
      'Ich habe ein festes monatliches Budget.',
      'Ich lege jeden Monat etwas Geld zur Seite.',
      'Ich verzichte lieber auf etwas, als mein Erspartes anzugreifen.',
      'Ich führe eine Übersicht über meine Ausgaben.',
      'Spontane Käufe bereue ich oft im Nachhinein.',
    ],
  },
  {
    id: 'krypto',
    name: 'Kryptowährung',
    icon: '🪙',
    questions: [
      'Ich besitze oder besaß schon einmal Kryptowährung.',
      'Ich würde einen Teil meines Ersparten in Krypto investieren.',
      'Ich verstehe, wie Blockchain grundsätzlich funktioniert.',
      'Ich halte Krypto für eine sinnvolle Zukunftsinvestition.',
      'Die Kursschwankungen bei Krypto würden mich nervös machen.',
    ],
  },
  {
    id: 'gehalt',
    name: 'Gehalt & Karriereziele',
    icon: '💼',
    questions: [
      'Gehalt ist für mich wichtiger als Sinnhaftigkeit im Job.',
      'Ich würde für mehr Gehalt den Job wechseln.',
      'Ich habe ein klares Gehaltsziel für die nächsten Jahre.',
      'Ich spreche offen mit Freunden über mein Gehalt.',
      'Ich würde für eine Beförderung mehr Verantwortung in Kauf nehmen.',
    ],
  },
  {
    id: 'luxus',
    name: 'Luxus & Konsum',
    icon: '🛍️',
    questions: [
      'Ich gönne mir regelmäßig teure Dinge.',
      'Markenkleidung ist mir wichtig.',
      'Ich würde für Qualität deutlich mehr bezahlen.',
      'Ich kaufe eher wenige, dafür hochwertige Dinge.',
      'Ich fühle mich durch besondere Anschaffungen glücklicher.',
    ],
  },
  {
    id: 'schulden',
    name: 'Schulden & Kredite',
    icon: '💳',
    questions: [
      'Ich habe schon einmal einen Kredit aufgenommen.',
      'Ich würde auf Raten kaufen, um mir etwas sofort leisten zu können.',
      'Schulden bereiten mir Bauchschmerzen.',
      'Ich zahle meine Kreditkarte immer komplett und pünktlich ab.',
      'Ich würde mir Geld von Freunden oder Familie leihen, wenn nötig.',
    ],
  },
  {
    id: 'sidehustle',
    name: 'Nebenverdienst & Side Hustle',
    icon: '💡',
    questions: [
      'Ich habe neben meinem Hauptjob eine weitere Einnahmequelle.',
      'Ich würde gerne mein eigenes kleines Business aufbauen.',
      'Ich verkaufe gebrauchte Sachen online, um Geld zu verdienen.',
      'Ich würde meine Freizeit für einen Nebenverdienst opfern.',
      'Finanzielle Unabhängigkeit ist mir sehr wichtig.',
    ],
  },
  // --- Partnerschaft & Beziehung ---
  {
    id: 'beziehung',
    name: 'Beziehung & Partnerschaft',
    icon: '💑',
    questions: [
      'Ich rede offen mit meinem Partner/meiner Partnerin über Gefühle.',
      'Gemeinsame Zeit ist mir wichtiger als eigene Freizeit.',
      'Ich könnte mir eine langjährige Beziehung ohne Trauschein vorstellen.',
      'Streit gehört für mich zu einer gesunden Beziehung dazu.',
      'Ich würde für eine Beziehung umziehen.',
    ],
  },
  {
    id: 'dating',
    name: 'Dating & Kennenlernen',
    icon: '💌',
    questions: [
      'Ich gehe aktiv auf Menschen zu, die mir gefallen.',
      'Ich würde ein Blind Date ausprobieren.',
      'Der erste Eindruck ist für mich entscheidend.',
      'Ich nehme mir beim Dating viel Zeit, bevor ich mich festlege.',
      'Gemeinsame Interessen sind mir wichtiger als Aussehen.',
    ],
  },
  {
    id: 'heirat',
    name: 'Heirat & Kinderwunsch',
    icon: '👶',
    questions: [
      'Ich könnte mir vorstellen, in den nächsten 5 Jahren zu heiraten.',
      'Kinder gehören für mich zu einem erfüllten Leben dazu.',
      'Ich würde auch ohne Trauschein glücklich zusammenleben.',
      'Eine große Hochzeit ist mir wichtig.',
      'Ich habe eine klare Vorstellung davon, wie viele Kinder ich möchte.',
    ],
  },
  {
    id: 'eifersucht',
    name: 'Eifersucht & Vertrauen',
    icon: '🔒',
    questions: [
      'Ich werde schnell eifersüchtig.',
      'Ich schaue manchmal auf das Handy meines Partners/meiner Partnerin.',
      'Vertrauen ist für mich wichtiger als Kontrolle.',
      'Ich würde offen ansprechen, wenn mich etwas eifersüchtig macht.',
      'Eifersucht zeigt für mich, dass jemand mich wirklich mag.',
    ],
  },
  {
    id: 'kommunikation',
    name: 'Kommunikation in der Beziehung',
    icon: '💬',
    questions: [
      'Ich spreche Probleme sofort an, statt sie zu verdrängen.',
      'Ich kann gut zuhören, ohne gleich zu urteilen.',
      'Ich vermeide Streit, auch wenn mich etwas stört.',
      'Ich sage klar, was ich mir von meinem Gegenüber wünsche.',
      'Ich entschuldige mich schnell, wenn ich im Unrecht bin.',
    ],
  },
  {
    id: 'fernbeziehung',
    name: 'Fernbeziehung',
    icon: '📍',
    questions: [
      'Ich könnte mir eine Fernbeziehung vorstellen.',
      'Videocalls würden mir als Nähe-Ersatz reichen.',
      'Ich würde für eine Fernbeziehung regelmäßig weite Strecken reisen.',
      'Räumliche Distanz würde meine Gefühle nicht verändern.',
      'Ich hätte Angst, dass sich in einer Fernbeziehung jemand entfremdet.',
    ],
  },
  {
    id: 'trennung',
    name: 'Trennung & Neuanfang',
    icon: '🔄',
    questions: [
      'Ich brauche nach einer Trennung viel Zeit für mich.',
      'Ich könnte nach einer Trennung schnell wieder Freundschaft schließen.',
      'Ich spreche offen mit Freunden über eine Trennung.',
      'Ich würde nach einer Trennung sofort etwas Neues anfangen wollen.',
      'Ich glaube, dass man aus jeder Trennung etwas lernt.',
    ],
  },
  {
    id: 'onlinedating',
    name: 'Online-Dating',
    icon: '📱',
    questions: [
      'Ich habe schon eine Dating-App genutzt.',
      'Ich könnte mir vorstellen, jemanden allein über eine App kennenzulernen und zu heiraten.',
      'Ein gutes Profilbild ist für mich entscheidend.',
      'Ich swipe eher schnell und viel, statt lange zu überlegen.',
      'Ich war schon einmal auf einem Date von einer Dating-App.',
    ],
  },
  // --- Filme, Serien & Entertainment ---
  {
    id: 'filme',
    name: 'Filme & Kino',
    icon: '🎬',
    questions: [
      'Ich gehe regelmäßig ins Kino.',
      'Ich schaue lieber Filme als Serien.',
      'Ich würde einen Film ein zweites Mal im Kino schauen.',
      'Popcorn gehört für mich fest zum Kinoerlebnis.',
      'Ich mag Independent-Filme lieber als große Blockbuster.',
    ],
  },
  {
    id: 'serien',
    name: 'Serien & Streaming',
    icon: '📺',
    questions: [
      'Ich schaue mehrere Folgen einer Serie hintereinander.',
      'Ich habe mehr als zwei Streaming-Abos gleichzeitig.',
      'Ich schaue Serien lieber allein als mit anderen.',
      'Ich vermeide Spoiler auch für mich selbst konsequent.',
      'Ich würde eine Serie abbrechen, wenn mir die erste Folge nicht gefällt.',
    ],
  },
  {
    id: 'musik',
    name: 'Musik & Playlists',
    icon: '🎵',
    questions: [
      'Ich höre fast jeden Tag Musik.',
      'Ich erstelle mir eigene Playlists für verschiedene Stimmungen.',
      'Live-Konzerte sind mir wichtiger als Studioaufnahmen.',
      'Ich entdecke neue Musik eher über Empfehlungen als selbst zu suchen.',
      'Ich könnte einen Tag komplett ohne Musik verbringen.',
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming & Videospiele',
    icon: '🎮',
    questions: [
      'Ich spiele mehrmals die Woche Videospiele.',
      'Ich spiele lieber online mit anderen als allein.',
      'Ich würde Geld für In-Game-Käufe ausgeben.',
      'E-Sport verfolge ich wie andere Leute klassischen Sport.',
      'Ich könnte mir vorstellen, komplett mit dem Gaming aufzuhören.',
    ],
  },
  {
    id: 'buecher',
    name: 'Bücher & Lesen',
    icon: '📚',
    questions: [
      'Ich lese regelmäßig Bücher.',
      'Ich lese lieber ein physisches Buch als ein E-Book.',
      'Ich könnte ein spannendes Buch an einem Tag durchlesen.',
      'Sachbücher interessieren mich mehr als Romane.',
      'Ich empfehle Bücher, die mir gefallen haben, aktiv weiter.',
    ],
  },
  {
    id: 'konzerte',
    name: 'Konzerte & Festivals',
    icon: '🎤',
    questions: [
      'Ich gehe mindestens einmal im Jahr auf ein Konzert.',
      'Ich würde für ein Lieblingskonzert eine weite Reise auf mich nehmen.',
      'Festivals mit Zelten wären etwas für mich.',
      'Ich filme lieber Momente auf Konzerten, statt sie einfach zu genießen.',
      'Ich würde auch allein zu einem Konzert gehen.',
    ],
  },
  {
    id: 'podcasts',
    name: 'Podcasts',
    icon: '🎧',
    questions: [
      'Ich höre regelmäßig Podcasts.',
      'Ich höre Podcasts vor allem, um etwas zu lernen statt zur Unterhaltung.',
      'Ich höre Podcasts auf 1,5-facher Geschwindigkeit oder schneller.',
      'Ich würde gerne selbst einen Podcast starten.',
      'Ich höre Podcasts eher unterwegs als zuhause.',
    ],
  },
  // --- Social Media ---
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    questions: [
      'Ich nutze Instagram täglich.',
      'Ich poste regelmäßig eigene Fotos oder Storys.',
      'Ich vergleiche mein Leben manchmal mit dem, was ich auf Instagram sehe.',
      'Ich würde mein Profil auf privat stellen.',
      'Likes sind mir wichtig, wenn ich etwas poste.',
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎥',
    questions: [
      'Ich nutze TikTok regelmäßig.',
      'Ich verliere beim Scrollen leicht das Zeitgefühl.',
      'Ich habe schon einmal selbst ein Video hochgeladen.',
      'TikTok-Trends beeinflussen, was ich mir kaufe oder anschaue.',
      'Ich finde die meisten Inhalte auf TikTok eher oberflächlich.',
    ],
  },
  {
    id: 'socialmedia',
    name: 'Social Media allgemein',
    icon: '📱',
    questions: [
      'Ich verbringe mehr als zwei Stunden täglich auf Social Media.',
      'Ich könnte eine Woche ganz ohne Social Media auskommen.',
      'Social Media macht mich eher gestresst als glücklich.',
      'Ich habe schon einmal bewusst eine Social-Media-Pause gemacht.',
      'Ich schaue morgens als Erstes auf mein Handy.',
    ],
  },
  {
    id: 'influencer',
    name: 'Influencer & Content Creator',
    icon: '🌟',
    questions: [
      'Ich folge mehreren Influencern aktiv.',
      'Ich würde Produkte kaufen, die ein Influencer empfiehlt.',
      'Ich könnte mir vorstellen, selbst Content Creator zu werden.',
      'Ich finde, dass Influencer zu viel Einfluss auf junge Menschen haben.',
      'Ich unterscheide gut zwischen Werbung und ehrlicher Empfehlung.',
    ],
  },
  {
    id: 'privatsphaere',
    name: 'Online-Reputation & Privatsphäre',
    icon: '🔐',
    questions: [
      'Ich überlege genau, was ich online von mir preisgebe.',
      'Ich habe schon einmal alte Posts von mir gelöscht.',
      'Ich google mich manchmal selbst, um zu sehen, was zu finden ist.',
      'Ich mache mir Sorgen um meine Daten im Internet.',
      'Ich würde einen Arbeitgeber mein Profil frei einsehen lassen.',
    ],
  },
  {
    id: 'memes',
    name: 'Memes & Humor',
    icon: '😂',
    questions: [
      'Ich schicke täglich Memes an Freunde.',
      'Ich verstehe die meisten aktuellen Meme-Trends.',
      'Humor ist für mich wichtiger als Aussehen bei anderen Menschen.',
      'Ich lache eher über schwarzen Humor als über klassische Witze.',
      'Ich würde selbst gerne Memes erstellen.',
    ],
  },
  // --- Alltag & Lifestyle ---
  {
    id: 'fitness',
    name: 'Fitness & Gym',
    icon: '🏋️',
    questions: [
      'Ich gehe regelmäßig ins Fitnessstudio.',
      'Ich tracke meine Workouts oder Fortschritte.',
      'Ich würde lieber zuhause als im Gym trainieren.',
      'Proteinreiche Ernährung ist mir wichtig.',
      'Ich könnte mir ein Leben ohne regelmäßigen Sport vorstellen.',
    ],
  },
  {
    id: 'mode',
    name: 'Mode & Style',
    icon: '👗',
    questions: [
      'Ich achte bewusst auf meinen Kleidungsstil.',
      'Ich gebe monatlich Geld für neue Kleidung aus.',
      'Ich folge aktuellen Modetrends.',
      'Second-Hand-Kleidung kaufe ich genauso gerne wie neue.',
      'Mein Style verändert sich oft.',
    ],
  },
  {
    id: 'wohnen',
    name: 'Wohnen: WG oder allein',
    icon: '🏠',
    questions: [
      'Ich lebe lieber allein als mit Mitbewohnern.',
      'Ich könnte mir eine WG mit Fremden gut vorstellen.',
      'Ordnung in der Wohnung ist mir sehr wichtig.',
      'Ich würde für eine schönere Wohnung mehr Miete zahlen.',
      'Ich fühle mich in meiner eigenen Wohnung am wohlsten.',
    ],
  },
  {
    id: 'nachhaltigkeit',
    name: 'Nachhaltigkeit & Umwelt',
    icon: '🌍',
    questions: [
      'Ich achte bewusst auf meinen ökologischen Fußabdruck.',
      'Ich kaufe bevorzugt nachhaltige Produkte, auch wenn sie teurer sind.',
      'Ich trenne konsequent meinen Müll.',
      'Ich würde für den Klimaschutz auf Flugreisen verzichten.',
      'Ich spreche mit anderen aktiv über Umweltthemen.',
    ],
  },
  {
    id: 'mentalhealth',
    name: 'Mental Health & Achtsamkeit',
    icon: '🧘',
    questions: [
      'Ich nehme mir bewusst Zeit für meine mentale Gesundheit.',
      'Ich würde bei Bedarf professionelle Hilfe in Anspruch nehmen.',
      'Ich praktiziere Meditation oder Achtsamkeitsübungen.',
      'Ich spreche offen über meine Gefühle mit anderen.',
      'Stress erkenne ich bei mir selbst frühzeitig.',
    ],
  },
  {
    id: 'schlaf',
    name: 'Schlaf & Erholung',
    icon: '😴',
    questions: [
      'Ich schlafe regelmäßig mindestens 7 Stunden.',
      'Ich gehe jeden Tag zur gleichen Uhrzeit ins Bett.',
      'Ich nutze mein Handy noch im Bett vor dem Einschlafen.',
      'Ich fühle mich morgens meistens ausgeschlafen.',
      'Ein Mittagsschlaf gehört für mich zum perfekten Tag.',
    ],
  },
  {
    id: 'party',
    name: 'Party & Nachtleben',
    icon: '🎉',
    questions: [
      'Ich gehe regelmäßig feiern.',
      'Ich bleibe auf Partys meist bis spät in die Nacht.',
      'Ich tanze gerne, auch wenn ich nüchtern bin.',
      'Ich würde eine kleine Runde einer großen Party vorziehen.',
      'Am nächsten Tag brauche ich nach dem Feiern lange, um mich zu erholen.',
    ],
  },
  {
    id: 'freundschaft',
    name: 'Freundschaften',
    icon: '🤝',
    questions: [
      'Ich habe einen festen engen Freundeskreis.',
      'Ich melde mich regelmäßig aktiv bei Freunden.',
      'Ich würde für einen Freund/eine Freundin meine Pläne kurzfristig ändern.',
      'Ich pflege auch Freundschaften über weite Distanzen.',
      'Neue Freundschaften zu schließen fällt mir leicht.',
    ],
  },
  {
    id: 'studium',
    name: 'Studium & Ausbildung',
    icon: '🎓',
    questions: [
      'Ich bin mit meiner aktuellen Ausbildung/meinem Studium zufrieden.',
      'Ich würde noch einmal das Gleiche studieren oder lernen.',
      'Praktische Erfahrung ist mir wichtiger als Theorie.',
      'Ich habe während der Ausbildung/des Studiums nebenbei gearbeitet.',
      'Ich könnte mir ein weiteres Studium oder eine Weiterbildung vorstellen.',
    ],
  },
  {
    id: 'job',
    name: 'Job & Arbeitsalltag',
    icon: '💻',
    questions: [
      'Ich gehe gerne zur Arbeit.',
      'Homeoffice ist mir wichtiger als ein fester Büroplatz.',
      'Ich trenne Arbeit und Freizeit klar voneinander.',
      'Ich würde für einen sinnvolleren Job weniger Gehalt akzeptieren.',
      'Ich rede in meiner Freizeit oft über die Arbeit.',
    ],
  },
  {
    id: 'technologie',
    name: 'Technologie & Gadgets',
    icon: '🔌',
    questions: [
      'Ich kaufe mir regelmäßig neue Technik-Gadgets.',
      'Ich informiere mich vor einem Kauf ausführlich über Produkte.',
      'Ich würde ein Jahr ohne Smartphone auskommen können.',
      'Neue Technik probiere ich gerne sofort aus.',
      'Ich repariere Geräte lieber, statt sie neu zu kaufen.',
    ],
  },
  {
    id: 'haustiere',
    name: 'Haustiere',
    icon: '🐶',
    questions: [
      'Ich habe ein Haustier oder hatte schon eines.',
      'Ich könnte mir ein Leben ohne Haustier nicht vorstellen.',
      'Ich würde für mein Haustier meine Pläne ändern.',
      'Hunde mag ich lieber als Katzen.',
      'Ich würde ein Haustier auch allein großziehen können.',
    ],
  },
  {
    id: 'autos',
    name: 'Autos & Führerschein',
    icon: '🚗',
    questions: [
      'Ich habe einen Führerschein.',
      'Ein eigenes Auto ist mir wichtig.',
      'Ich würde lieber öffentliche Verkehrsmittel nutzen als ein Auto besitzen.',
      'Elektroautos sind für mich die Zukunft.',
      'Ich fahre gerne selbst, statt gefahren zu werden.',
    ],
  },
  {
    id: 'astrologie',
    name: 'Astrologie & Sternzeichen',
    icon: '♈',
    questions: [
      'Ich kenne mein Sternzeichen und das meiner Freunde.',
      'Ich glaube, dass Sternzeichen etwas über den Charakter aussagen.',
      'Ich lese gelegentlich mein Horoskop.',
      'Ich würde die Kompatibilität mit einem Partner nach dem Sternzeichen einschätzen.',
      'Astrologie beeinflusst meine Entscheidungen im Alltag.',
    ],
  },
  {
    id: 'konflikt',
    name: 'Konfliktverhalten',
    icon: '⚡',
    questions: [
      'Ich gehe Konflikten eher aus dem Weg.',
      'Ich spreche Probleme direkt an, statt sie schwelen zu lassen.',
      'Ich kann mich schnell wieder vertragen nach einem Streit.',
      'Ich brauche nach einem Konflikt Zeit für mich, bevor ich reden kann.',
      'Ich gebe in einem Streit eher schnell nach.',
    ],
  },
  {
    id: 'koerperbild',
    name: 'Körperbild & Selbstvertrauen',
    icon: '🪞',
    questions: [
      'Ich fühle mich in meinem Körper wohl.',
      'Ich vergleiche mein Aussehen oft mit anderen.',
      'Ich würde mich für mehr Selbstbewusstsein professionell unterstützen lassen.',
      'Ich betreibe Sport auch wegen meines Aussehens.',
      'Komplimente über mein Aussehen fallen mir schwer anzunehmen.',
    ],
  },
  {
    id: 'ehrenamt',
    name: 'Ehrenamt & Engagement',
    icon: '🤲',
    questions: [
      'Ich engagiere mich ehrenamtlich oder sozial.',
      'Ich würde einen Teil meiner Freizeit für einen guten Zweck spenden.',
      'Ich spende regelmäßig Geld für wohltätige Zwecke.',
      'Gesellschaftliches Engagement ist mir wichtig bei anderen Menschen.',
      'Ich würde für ein soziales Projekt ins Ausland gehen.',
    ],
  },
];

/** The shared catalog of topics. Every person answers into the same groups independently. */
export const QUESTION_GROUPS: QuestionGroup[] = GROUP_DEFS.map((group) => ({
  id: group.id,
  name: group.name,
  icon: group.icon,
  questions: group.questions.map((text, index) => ({ id: `${group.id}-q${index + 1}`, text })),
}));

export const FRIENDS: Friend[] = [
  { id: 'lena', name: 'Lena', avatarEmoji: '🦊', streak: 12 },
  { id: 'tom', name: 'Tom', avatarEmoji: '🐨', streak: 5 },
  { id: 'sara', name: 'Sara', avatarEmoji: '🐢', streak: 0 },
  { id: 'mia', name: 'Mia', avatarEmoji: '🐝', streak: 3 },
];

export const DEFAULT_PROFILE: Profile = {
  name: 'Du',
  avatarEmoji: '🙂',
};

export const AVATAR_CHOICES = ['🙂', '😎', '🦊', '🐨', '🐢', '🐝', '🐼', '🦁', '🐧', '🦄', '🐙', '🌵'];

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function round(questionIds: string[], values: AnswerValue[], at: string): HistoryMap {
  const map: HistoryMap = {};
  questionIds.forEach((id, i) => {
    map[id] = [{ value: values[i], at }];
  });
  return map;
}

function mergeRounds(...rounds: HistoryMap[]): HistoryMap {
  const merged: HistoryMap = {};
  for (const round_ of rounds) {
    for (const [questionId, entries] of Object.entries(round_)) {
      merged[questionId] = [...(merged[questionId] ?? []), ...entries];
    }
  }
  return merged;
}

const urlaubIds = QUESTION_GROUPS.find((g) => g.id === 'urlaub')!.questions.map((q) => q.id);
const sportIds = QUESTION_GROUPS.find((g) => g.id === 'sport')!.questions.map((q) => q.id);

/**
 * subjectId -> groupId -> HistoryMap. A missing group means "never answered
 * yet". Each completed round through a group's 5 questions adds one new,
 * timestamped entry per question - nothing is ever overwritten.
 */
export const INITIAL_HISTORY: Record<string, Record<string, HistoryMap>> = {
  me: {
    // Demonstrates exactly the "changed my mind over the year" use case:
    // question 3 ("lieber campen") went Nie -> Eher ja -> (answer again to see it become "Ja").
    urlaub: mergeRounds(
      round(urlaubIds, ['no', 'no', 'never', 'yes', 'leanYes'], monthsAgo(12)),
      round(urlaubIds, ['leanNo', 'no', 'leanYes', 'yes', 'yes'], monthsAgo(3)),
    ),
  },
  tom: {
    sport: round(sportIds, ['yes', 'leanYes', 'no', 'leanNo', 'yes'], daysAgo(2)),
  },
  lena: {
    // High overlap with "me" on Urlaub - shows up as a strong Match.
    urlaub: round(urlaubIds, ['leanNo', 'no', 'leanYes', 'yes', 'leanNo'], daysAgo(5)),
  },
  mia: {
    // Mostly different from "me" on Urlaub - shows up as a weak Match.
    urlaub: round(urlaubIds, ['yes', 'yes', 'no', 'no', 'no'], daysAgo(10)),
  },
};

/** Guesses a friend already made about me, keyed by friend id -> group id -> answers. */
export const INITIAL_GUESSES_ABOUT_ME: Record<string, Record<string, AnswerMap>> = {
  lena: {
    freizeit: {
      'freizeit-q1': 'leanYes',
      'freizeit-q2': 'yes',
      'freizeit-q3': 'no',
      'freizeit-q4': 'leanNo',
      'freizeit-q5': 'yes',
    },
  },
};
