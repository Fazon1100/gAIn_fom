export type MuscleCategory =
  | 'brust'
  | 'ruecken'
  | 'schultern'
  | 'bizeps'
  | 'trizeps'
  | 'beine'
  | 'core'
  | 'cardio';

export type Difficulty = 'anfaenger' | 'fortgeschritten' | 'experte';

export type Equipment =
  | 'langhantel'
  | 'kurzhantel'
  | 'kabel'
  | 'maschine'
  | 'koerpergewicht'
  | 'kettlebell'
  | 'stange';

export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  category: MuscleCategory;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: Equipment[];
  difficulty: Difficulty;
  description: string;
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
  alternativeIds: string[];
}

export const CATEGORY_LABELS: Record<MuscleCategory, string> = {
  brust: 'Brust',
  ruecken: 'Rücken',
  schultern: 'Schultern',
  bizeps: 'Bizeps',
  trizeps: 'Trizeps',
  beine: 'Beine',
  core: 'Core',
  cardio: 'Cardio',
};

export const CATEGORY_COLORS: Record<MuscleCategory, string> = {
  brust: '#FF6B6B',
  ruecken: '#4ECDC4',
  schultern: '#45B7D1',
  bizeps: '#96CEB4',
  trizeps: '#FBBF24',
  beine: '#A78BFA',
  core: '#FB923C',
  cardio: '#F472B6',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  anfaenger: 'Anfänger',
  fortgeschritten: 'Fortgeschritten',
  experte: 'Experte',
};

export const EXERCISES: Exercise[] = [
  // ─── BRUST ────────────────────────────────────────────────────────────
  {
    id: 'bankdruecken',
    name: 'Bankdrücken',
    nameEn: 'Bench Press',
    category: 'brust',
    primaryMuscles: ['Pectoralis Major (Brust)'],
    secondaryMuscles: ['Trizeps', 'Vorderer Deltamuskel'],
    equipment: ['langhantel'],
    difficulty: 'fortgeschritten',
    description:
      'Das Bankdrücken ist die Königsübung für die Brust. Es trainiert den gesamten Brustmuskel mit hohem Kraftpotenzial und ist unverzichtbar für den Oberkörperaufbau.',
    instructions: [
      'Leg dich flach auf die Bank. Füße fest auf den Boden, Schulterblätter zusammenziehen und in die Bank drücken.',
      'Greif die Stange etwas breiter als Schulterbreite – Daumen umschließen die Stange vollständig.',
      'Heb die Stange aus der Ablage und positioniere sie über der Brust.',
      'Senk die Stange kontrolliert ab, bis sie leicht die Brust berührt. Ellbogen ca. 60–75° zum Körper.',
      'Drück die Stange explosiv nach oben, ohne die Schulterblätter von der Bank zu heben.',
      'Halte oben kurz an und wiederhole die Bewegung.',
    ],
    tips: [
      'Füße fest auf dem Boden für maximale Stabilität',
      'Stell dir vor, du drückst deinen Körper weg von der Stange',
      'Atme unten ein, oben aus',
      'Halte die Handgelenke gerade – kein Ausknicken',
    ],
    commonMistakes: [
      'Ellbogen zu weit ausgestreckt (90°) – Schultern überlastet',
      'Hüfte von der Bank heben (Arschbrücke vermeiden)',
      'Abspringen der Stange von der Brust',
      'Zu weiter oder zu enger Griff',
    ],
    alternativeIds: ['liegestuetze', 'schraegbankdruecken', 'dips_brust'],
  },
  {
    id: 'schraegbankdruecken',
    name: 'Schrägbankdrücken',
    nameEn: 'Incline Bench Press',
    category: 'brust',
    primaryMuscles: ['Pectoralis Major oben (obere Brust)'],
    secondaryMuscles: ['Trizeps', 'Vorderer Deltamuskel'],
    equipment: ['langhantel', 'kurzhantel'],
    difficulty: 'fortgeschritten',
    description:
      'Das Schrägbankdrücken betont die obere Brust und füllt den Bereich nahe des Schlüsselbeins. Die Bank ist auf 30–45° geneigt, was den Fokus klar nach oben verlagert.',
    instructions: [
      'Stelle die Bank auf 30–45° Neigung ein. Leg dich rücken auf die Bank.',
      'Schulterblätter zusammenziehen und in die Polsterung drücken.',
      'Greif die Stange etwas breiter als Schulterbreite.',
      'Senk die Stange zur Oberbrust (Schlüsselbein-Nähe) ab.',
      'Drück die Stange explosiv in die Ausgangsposition zurück.',
    ],
    tips: [
      'Nicht zu steil – über 45° wird es eher ein Schulterdrücken',
      'Die Stange berührt die Oberbrust, nicht den Hals',
      'Kurzhanteln für etwas mehr Bewegungsfreiheit',
    ],
    commonMistakes: [
      'Bank zu steil eingestellt (>45°)',
      'Schulterblätter von der Bank abheben',
      'Nur halbe Bewegung ausführen',
    ],
    alternativeIds: ['bankdruecken', 'kabelzug_fly', 'liegestuetze'],
  },
  {
    id: 'liegestuetze',
    name: 'Liegestütze',
    nameEn: 'Push-ups',
    category: 'brust',
    primaryMuscles: ['Pectoralis Major (Brust)'],
    secondaryMuscles: ['Trizeps', 'Vorderer Deltamuskel', 'Core'],
    equipment: ['koerpergewicht'],
    difficulty: 'anfaenger',
    description:
      'Liegestütze sind die fundamentalste Brustübung ohne Equipment. Sie trainieren Brust, Trizeps und Schultern gleichzeitig und eignen sich für überall – zuhause, im Park oder als Aufwärmübung.',
    instructions: [
      'Begib dich in die Plank-Position: Hände etwas breiter als schulterbreit, Körper gerade.',
      'Spannung im Core halten, Hüfte weder hoch noch durchhängen lassen.',
      'Beuge die Ellbogen und senk den Körper ab, bis die Brust fast den Boden berührt.',
      'Drück dich explosiv in die Ausgangsposition zurück.',
      'Atme beim Absenken ein, beim Hochdrücken aus.',
    ],
    tips: [
      'Körper als eine starre Linie von Kopf bis Ferse halten',
      'Ellbogen nicht zu weit nach außen – ca. 45°',
      'Variations: Eng (mehr Trizeps), Breit (mehr Brust), Erhöht (untere Brust)',
    ],
    commonMistakes: [
      'Hüfte hochziehen oder durchhängen lassen',
      'Kopf nach vorne strecken (Nacken überstreckt)',
      'Nicht volle Bewegung ausführen',
    ],
    alternativeIds: ['bankdruecken', 'dips_brust'],
  },
  {
    id: 'dips_brust',
    name: 'Dips (Brust)',
    nameEn: 'Chest Dips',
    category: 'brust',
    primaryMuscles: ['Pectoralis Major unterer Teil'],
    secondaryMuscles: ['Trizeps', 'Vorderer Deltamuskel'],
    equipment: ['stange', 'koerpergewicht'],
    difficulty: 'fortgeschritten',
    description:
      'Brust-Dips trainieren besonders die untere Brust und den Übergang zum Trizeps. Durch vorgebeugten Oberkörper liegt der Fokus klar auf der Brust.',
    instructions: [
      'Greif zwei parallele Stangen und stütz dich oben ab.',
      'Lehne den Oberkörper leicht nach vorne (ca. 20–30°) – das verschiebt den Fokus zur Brust.',
      'Lass dich kontrolliert absinken, bis deine Ellbogen bei 90° sind.',
      'Drück dich kraftvoll zurück in die Ausgangsposition.',
    ],
    tips: [
      'Vorgebeugter Oberkörper = mehr Brust, aufrechter = mehr Trizeps',
      'Mit Zusatzgewicht steigern, sobald 15+ Wiederholungen locker gehen',
      'Schultern nicht hochziehen',
    ],
    commonMistakes: [
      'Zu weit absenken (Schulterimpingement-Risiko)',
      'Schwingen mit dem Körper',
      'Schultern hochziehen',
    ],
    alternativeIds: ['bankdruecken', 'kabelzug_fly'],
  },
  {
    id: 'kabelzug_fly',
    name: 'Kabelzug-Fliegende',
    nameEn: 'Cable Fly',
    category: 'brust',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Vorderer Deltamuskel'],
    equipment: ['kabel'],
    difficulty: 'anfaenger',
    description:
      'Kabelzug-Fliegende isolieren die Brust mit konstantem Zugwiderstand durch die gesamte Bewegung – ideal als Finishing-Übung nach Druckübungen.',
    instructions: [
      'Stelle zwei Kabelzüge auf Brust- oder Schulterhöhe ein.',
      'Steh in der Mitte, greif die Griffe und trete einen Schritt nach vorne.',
      'Arme leicht gebeugt halten, Hände weiten Abstand haben.',
      'Führe die Hände in einem Bogen aufeinander zu, als ob du einen Baum umarmst.',
      'Kurz in der Mitte halten, dann kontrolliert zurückführen.',
    ],
    tips: [
      'Leichte Beugung im Ellbogen während der gesamten Bewegung',
      'Bewegung aus der Brust initiieren, nicht aus den Armen',
      'Höhe des Kabelzugs verändert den Fokus: hoch = untere Brust, niedrig = obere Brust',
    ],
    commonMistakes: [
      'Arme zu stark beugen (wird zu einem Ruderversuch)',
      'Hände nicht vollständig zusammenführen',
      'Zu schweres Gewicht gewählt',
    ],
    alternativeIds: ['liegestuetze', 'bankdruecken'],
  },

  // ─── RÜCKEN ──────────────────────────────────────────────────────────
  {
    id: 'klimmzuege',
    name: 'Klimmzüge',
    nameEn: 'Pull-ups',
    category: 'ruecken',
    primaryMuscles: ['Latissimus Dorsi'],
    secondaryMuscles: ['Bizeps', 'Rhomboiden', 'Hinterer Deltamuskel'],
    equipment: ['stange', 'koerpergewicht'],
    difficulty: 'experte',
    description:
      'Klimmzüge sind die beste Körpergewichtsübung für den Rücken. Sie bauen massiven Latissimus auf und verbessern die gesamte Oberkörperkraft. Übergriff (Pronation) betont den Rücken, Untergriff (Supination) stärker den Bizeps.',
    instructions: [
      'Greif die Stange etwas breiter als schulterbreit mit Übergriff (Pronation).',
      'Hänge gestreckt, Schultern leicht nach unten und hinten gezogen (kein Hochziehen).',
      'Ziehe die Ellbogen nach unten und hinten, als ob du sie in die Hosentaschen stecken würdest.',
      'Zug fortsetzen bis das Kinn über die Stange kommt.',
      'Kontrolliert und langsam absenken – volle Streckung am unteren Ende.',
    ],
    tips: [
      'Stell dir vor, du drückst die Stange nach unten, nicht du ziehst dich hoch',
      'Schulterblätter erst zusammenziehen, dann Arme beugen',
      'Assistiertes Gerät oder Bänder als Einstieg nutzen',
    ],
    commonMistakes: [
      'Schultern hochziehen (Schulterfalle)',
      'Mit Schwung helfen (Kipping)',
      'Nicht volle Bewegungsreichweite',
    ],
    alternativeIds: ['lat_pulldown', 'langhantelrudern'],
  },
  {
    id: 'lat_pulldown',
    name: 'Latzug',
    nameEn: 'Lat Pulldown',
    category: 'ruecken',
    primaryMuscles: ['Latissimus Dorsi'],
    secondaryMuscles: ['Bizeps', 'Rhomboiden'],
    equipment: ['maschine', 'kabel'],
    difficulty: 'anfaenger',
    description:
      'Der Latzug ist die Maschinen-Alternative zu Klimmzügen und ideal für Anfänger oder um mit mehr Volumen zu trainieren. Durch die Einstellung des Gewichts ist er für jeden einsetzbar.',
    instructions: [
      'Sitz an der Maschine, Oberschenkel unter die Polster klemmen.',
      'Greif die Stange etwas breiter als schulterbreit.',
      'Lehne leicht zurück (ca. 10–15°), kein starkes Zurücklehnen.',
      'Ziehe die Stange zum Oberkörper (Kinn-Höhe oder obere Brust), Ellbogen nach unten.',
      'Schulterblätter am unteren Punkt zusammenziehen.',
      'Kontrolliert zurückführen und Rückenmuskel dehnen.',
    ],
    tips: [
      'Zur Brust ziehen, nicht hinter den Kopf (Verletzungsgefahr)',
      'Bewegung aus dem Rücken steuern, nicht aus den Armen',
      'Neutralgriff (Hände zeigen zueinander) für mehr Komfort',
    ],
    commonMistakes: [
      'Hinter den Kopf ziehen',
      'Zu stark zurücklehnen',
      'Ellbogen nach außen statt unten',
    ],
    alternativeIds: ['klimmzuege', 'langhantelrudern'],
  },
  {
    id: 'langhantelrudern',
    name: 'Langhantelrudern',
    nameEn: 'Barbell Row',
    category: 'ruecken',
    primaryMuscles: ['Latissimus Dorsi', 'Rhomboiden', 'Trapezius'],
    secondaryMuscles: ['Bizeps', 'Rückenstrecker', 'Hinterer Deltamuskel'],
    equipment: ['langhantel'],
    difficulty: 'fortgeschritten',
    description:
      'Langhantelrudern ist eine der effektivsten Übungen für den gesamten Rücken. Sie trainiert Breite und Dicke gleichzeitig und fördert eine starke, muskulöse Körperhaltung.',
    instructions: [
      'Stand schulterbreit, Knie leicht gebeugt. Langhantel aufheben.',
      'Vorgebeugt mit geradem Rücken – Oberkörper ca. 45° zur Hüfte neigen.',
      'Greif die Stange etwas breiter als schulterbreit (Übergriff).',
      'Ziehe die Stange zum Bauch-Nabel-Bereich – Ellbogen eng am Körper.',
      'Schulterblätter am oberen Punkt fest zusammenziehen.',
      'Kontrolliert absenken, Rücken gerade halten.',
    ],
    tips: [
      'Rücken durchgehend gerade – kein Rundrücken!',
      'Kopf in verlängerter Wirbelsäulenachse halten',
      'Untergriff-Variation betont stärker den Bizeps',
    ],
    commonMistakes: [
      'Rundrücken (hohe Verletzungsgefahr)',
      'Mit dem Rücken schwingen für mehr Gewicht',
      'Stange zu hoch (Schultern) statt zum Bauch ziehen',
    ],
    alternativeIds: ['kabelrudern', 'klimmzuege'],
  },
  {
    id: 'kabelrudern',
    name: 'Kabelrudern (sitzend)',
    nameEn: 'Seated Cable Row',
    category: 'ruecken',
    primaryMuscles: ['Rhomboiden', 'Latissimus Dorsi'],
    secondaryMuscles: ['Bizeps', 'Hinterer Deltamuskel', 'Trapezius'],
    equipment: ['kabel', 'maschine'],
    difficulty: 'anfaenger',
    description:
      'Das sitzende Kabelrudern ist ideal für Rücken-Dicke und Schulterblatt-Retraktion. Durch den konstanten Kabelzugwiderstand wird die Muskulatur gleichmäßig belastet.',
    instructions: [
      'Sitz aufrecht am Rudergerät, Knie leicht gebeugt, Füße auf die Ablageflächen.',
      'Greif den Griff mit beiden Händen, Rücken gerade, leicht nach vorne gelehnt.',
      'Ziehe den Griff zum Bauch, Ellbogen nach hinten und nah am Körper.',
      'Schulterblätter am Ende fest zusammendrücken – 1 Sekunde halten.',
      'Kontrolliert zurückführen und den Rücken leicht dehnen.',
    ],
    tips: [
      'Nicht mit dem Oberkörper schwingen',
      'Schulterblätter aktiv zusammenziehen',
      'Neutralgriff (Parallelgriff) schont die Schultern',
    ],
    commonMistakes: [
      'Oberkörper zu weit nach vorne und hinten schwingen',
      'Schultern hochziehen statt Schulterblätter',
      'Nur mit Armen rudern, Rücken vernachlässigen',
    ],
    alternativeIds: ['langhantelrudern', 'klimmzuege'],
  },
  {
    id: 'kreuzheben',
    name: 'Kreuzheben',
    nameEn: 'Deadlift',
    category: 'ruecken',
    primaryMuscles: ['Rückenstrecker', 'Gluteus', 'Hamstrings'],
    secondaryMuscles: ['Trapezius', 'Unterarme', 'Latissimus Dorsi', 'Core'],
    equipment: ['langhantel'],
    difficulty: 'experte',
    description:
      'Kreuzheben ist die kraftvollste Ganzkörperübung. Es aktiviert mehr Muskeln als fast jede andere Übung und ist fundamental für Kraft, Muskelmasse und eine gesunde Körperhaltung.',
    instructions: [
      'Stand schulterbreit, Zehen leicht nach außen. Hantel liegt über den Mittelfuß.',
      'In die Hocke gehen – Hüfte sinken lassen bis Hände die Stange greifen können.',
      'Stange im Übergriff oder Mischgriff greifen, Hände schulterbreit.',
      'Brust heben, Rücken strecken, tief einatmen und Bauch anspannen.',
      'Stange nah am Körper halten und mit den Beinen "boden wegdrücken".',
      'Hüfte und Schultern gleichzeitig hoch führen, Stange am Körper entlangziehen.',
      'Oben Hüfte nach vorne, aufrecht stehen. Kontrolliert absenken.',
    ],
    tips: [
      'Stange bleibt immer am Körper – kein Bogen nach außen',
      'Mit leichtem Gewicht perfekte Technik erlernen',
      'Gürtel erst ab schwerem Gewicht (>80–85% 1RM)',
    ],
    commonMistakes: [
      'Rundrücken (höchstes Verletzungsrisiko)',
      'Stange zu weit vom Körper',
      'Hüfte zu hoch oder zu tief zu Beginn',
      'Mit dem Rücken starten statt mit den Beinen',
    ],
    alternativeIds: ['langhantelrudern', 'rum_kreuzheben'],
  },

  // ─── SCHULTERN ────────────────────────────────────────────────────────
  {
    id: 'schulter_druck',
    name: 'Schulterdrücken (Überkopf)',
    nameEn: 'Overhead Press (OHP)',
    category: 'schultern',
    primaryMuscles: ['Deltamuskel (gesamt)', 'Vorderer Deltamuskel'],
    secondaryMuscles: ['Trizeps', 'Obere Brust', 'Core'],
    equipment: ['langhantel', 'kurzhantel'],
    difficulty: 'fortgeschritten',
    description:
      'Das Schulterdrücken ist die Grundübung für breite, runde Schultern. Es trainiert den Deltamuskel vollständig und fordert viel Core-Stabilität. Stehend ausgeführt aktiviert es den gesamten Körper.',
    instructions: [
      'Stand schulterbreit, Stange auf der vorderen Schulter (Rack-Höhe).',
      'Griff etwas breiter als schulterbreit, Ellbogen leicht vorne.',
      'Bauch und Po anspannen – Lendenlordose vermeiden.',
      'Drück die Stange senkrecht nach oben, Kopf leicht zurückweichen lassen.',
      'Stange über den Kopf führen, Ellbogen am Ende gestreckt.',
      'Kontrolliert absenken, Bewegung wiederholen.',
    ],
    tips: [
      'Hohlkreuz vermeiden – Core fest anspannen',
      'Stange geht hinter den Ohren, nicht vor dem Kopf nach oben',
      'Sitzend ausgeführt für mehr Isolation, stehend für mehr Gesamtbelastung',
    ],
    commonMistakes: [
      'Starkes Hohlkreuz (Lumbalproblem)',
      'Stange zu weit vor dem Körper führen',
      'Ellbogen zu weit nach außen',
    ],
    alternativeIds: ['seitheben', 'arnold_press'],
  },
  {
    id: 'seitheben',
    name: 'Seitheben',
    nameEn: 'Lateral Raises',
    category: 'schultern',
    primaryMuscles: ['Mittlerer Deltamuskel'],
    secondaryMuscles: ['Vorderer Deltamuskel', 'Supraspinatus'],
    equipment: ['kurzhantel', 'kabel'],
    difficulty: 'anfaenger',
    description:
      'Seitheben ist die Isolationsübung schlechthin für breite Schultern. Der mittlere Deltamuskel ist der Schlüssel zu dem begehrten "breiten Schulter"-Look und wird hier direkt angesteuert.',
    instructions: [
      'Stand schulterbreit, Kurzhanteln seitlich in den Händen, leicht nach vorne gebeugt.',
      'Ellbogen minimal gebeugt halten – keine gestreckten Arme.',
      'Hanteln seitlich anheben bis zur Schulterhöhe, kleiner Finger leicht nach oben drehen.',
      'Kurz oben halten, dann kontrolliert absenken.',
    ],
    tips: [
      'Leichtes Gewicht – Qualität schlägt Quantität',
      'Schultern nicht hochziehen (Trapez abkoppeln)',
      'Kabelzug-Variante für konstanten Widerstand',
    ],
    commonMistakes: [
      'Zu schweres Gewicht mit Schwung',
      'Schultern hochziehen',
      'Hanteln über Schulterhöhe heben',
    ],
    alternativeIds: ['schulter_druck', 'face_pull'],
  },
  {
    id: 'face_pull',
    name: 'Face Pull',
    nameEn: 'Face Pull',
    category: 'schultern',
    primaryMuscles: ['Hinterer Deltamuskel', 'Rhomboiden'],
    secondaryMuscles: ['Rotatorenmanschette', 'Trapezius'],
    equipment: ['kabel'],
    difficulty: 'anfaenger',
    description:
      'Face Pulls sind unverzichtbar für gesunde Schultern. Sie stärken den hinteren Deltamuskel und die Rotatorenmanschette – beides oft vernachlässigte Bereiche, die Verletzungen vorbeugen.',
    instructions: [
      'Kabelzug auf Gesichtshöhe einstellen, Seil-Attachment verwenden.',
      'Greif das Seil mit beiden Händen, Daumen nach oben zeigen.',
      'Ziehe das Seil zum Gesicht, Ellbogen nach außen und oben.',
      'Am Ende externe Rotation: Hände gehen seitlich zurück (wie ein "W").',
      'Kurz halten, kontrolliert zurückführen.',
    ],
    tips: [
      'Leichtes Gewicht – Technik über Gewicht',
      'Ellbogen höher als Schultern halten',
      'Ideal als Abschluss jedes Trainingstages',
    ],
    commonMistakes: [
      'Ellbogen zu tief (wird zu einem Rudern)',
      'Zu schweres Gewicht',
      'Keine externe Rotation am Ende',
    ],
    alternativeIds: ['seitheben', 'vogel'],
  },
  {
    id: 'arnold_press',
    name: 'Arnold Press',
    nameEn: 'Arnold Press',
    category: 'schultern',
    primaryMuscles: ['Vorderer Deltamuskel', 'Mittlerer Deltamuskel'],
    secondaryMuscles: ['Trizeps', 'Obere Brust'],
    equipment: ['kurzhantel'],
    difficulty: 'fortgeschritten',
    description:
      'Benannt nach Arnold Schwarzenegger kombiniert der Arnold Press eine Rotation mit dem Drücken und aktiviert alle drei Deltabereiche. Eine der vollständigsten Schulterübungen.',
    instructions: [
      'Sitz aufrecht, Kurzhanteln vor der Brust, Handflächen zeigen zu dir.',
      'Beim Drücken nach oben Hanteln nach außen rotieren.',
      'Oben: Handflächen zeigen nach vorne (klassische Drückposition).',
      'Kontrolliert absenken und zurückrotieren – Handflächen zeigen wieder zu dir.',
    ],
    tips: [
      'Bewegung flüssig ausführen – nicht ruckartig',
      'Rücken gerade, keine Hohlkreuzbildung',
      'Leichter Ansatz, da die Schultern durch die Rotation stärker beansprucht werden',
    ],
    commonMistakes: [
      'Rotation zu abrupt',
      'Rücken nicht neutral halten',
      'Zu schweres Gewicht gewählt',
    ],
    alternativeIds: ['schulter_druck', 'seitheben'],
  },
  {
    id: 'vogel',
    name: 'Reverse Flyes (Vogel)',
    nameEn: 'Reverse Flyes',
    category: 'schultern',
    primaryMuscles: ['Hinterer Deltamuskel'],
    secondaryMuscles: ['Rhomboiden', 'Trapezius'],
    equipment: ['kurzhantel', 'kabel'],
    difficulty: 'anfaenger',
    description:
      'Reverse Flyes (Vogel) isolieren den hinteren Deltamuskel. Dieser oft vernachlässigte Bereich ist entscheidend für runde Schultern und hilft, einer Rundhaltung entgegenzuwirken.',
    instructions: [
      'Sit auf einer Bank, stark nach vorne beugen (Brust auf den Oberschenkeln).',
      'Kurzhanteln mit leicht gebeugten Armen seitlich hängen lassen.',
      'Hanteln seitlich nach oben führen (Arme bilden ein "T").',
      'Schulterblätter zusammendrücken, kurz halten.',
      'Kontrolliert zurücksenken.',
    ],
    tips: [
      'Extrem leichtes Gewicht – der Muskel ist klein',
      'Bewegung aus dem Schulterblatt initiieren',
      'Kabelzug-Variante für konstanten Zug',
    ],
    commonMistakes: [
      'Zu schweres Gewicht',
      'Ellbogen zu stark beugen',
      'Trapez übernimmt die Arbeit',
    ],
    alternativeIds: ['face_pull', 'seitheben'],
  },

  // ─── BIZEPS ──────────────────────────────────────────────────────────
  {
    id: 'bizepscurl',
    name: 'Bizepscurl (Langhantel)',
    nameEn: 'Barbell Curl',
    category: 'bizeps',
    primaryMuscles: ['Bizeps Brachii'],
    secondaryMuscles: ['Brachialis', 'Brachioradialis'],
    equipment: ['langhantel'],
    difficulty: 'anfaenger',
    description:
      'Der Langhantel-Bizepscurl ist die klassischste Bizepsübung. Die Langhantel erlaubt schwere Gewichte und gleichmäßige Belastung beider Arme gleichzeitig.',
    instructions: [
      'Stand schulterbreit, Langhantel mit Untergriff schulterbreit greifen.',
      'Ellbogen seitlich am Körper fixiert halten – das ist entscheidend!',
      'Hantel durch Beugung des Ellbogens zur Brust curlen.',
      'Kurz oben anspannen, dann kontrolliert absenken.',
      'Volle Streckung am unteren Ende für maximale Bewegungsreichweite.',
    ],
    tips: [
      'Ellbogen nicht nach vorne schieben – sie bleiben am Körper',
      'EZ-Curl-Stange für Handgelenk-schonende Alternative',
      'Langsame exzentrische Phase (Absenken) für mehr Wachstumsreiz',
    ],
    commonMistakes: [
      'Ellbogen nach vorne schieben (Schulter übernimmt)',
      'Mit Rücken schwingen für mehr Gewicht',
      'Nicht volle Streckung am unteren Ende',
    ],
    alternativeIds: ['hammercurl', 'konzentrations_curl'],
  },
  {
    id: 'hammercurl',
    name: 'Hammercurl',
    nameEn: 'Hammer Curl',
    category: 'bizeps',
    primaryMuscles: ['Brachialis', 'Bizeps Brachii'],
    secondaryMuscles: ['Brachioradialis'],
    equipment: ['kurzhantel'],
    difficulty: 'anfaenger',
    description:
      'Der Hammercurl wird mit neutralem Griff (Daumen oben) ausgeführt und betont stärker den Brachialis – den Muskel, der den Bizeps nach oben drückt und so für mehr Armdicke sorgt.',
    instructions: [
      'Stand schulterbreit, Kurzhanteln seitlich in den Händen mit neutralem Griff (Daumen oben).',
      'Ellbogen nah am Körper, einer oder beide Arme gleichzeitig curlen.',
      'Hantel bis zur Schulter führen.',
      'Kontrolliert absenken, volle Streckung halten.',
    ],
    tips: [
      'Alternierend curlen für mehr Stabilität und Fokus pro Arm',
      'Handgelenk nicht beugen oder strecken – neutral halten',
      'Gut für Unterarm-Entwicklung',
    ],
    commonMistakes: [
      'Schwingen mit dem Körper',
      'Nicht vollständig strecken',
      'Handgelenk rotieren',
    ],
    alternativeIds: ['bizepscurl', 'kabelcurl'],
  },
  {
    id: 'konzentrations_curl',
    name: 'Konzentrations-Curl',
    nameEn: 'Concentration Curl',
    category: 'bizeps',
    primaryMuscles: ['Bizeps Brachii (langer Kopf)'],
    secondaryMuscles: ['Brachialis'],
    equipment: ['kurzhantel'],
    difficulty: 'anfaenger',
    description:
      'Der Konzentrations-Curl isoliert den Bizeps maximal durch die Fixierung des Ellbogens am Oberschenkel. Er fördert den Bizepsgipfel und ist ideal zum Abschluss des Bizepstrainings.',
    instructions: [
      'Sitz auf einer Bank, Beine etwas geöffnet.',
      'Ellbogen des trainierenden Arms auf dem Innenschenkel abstützen.',
      'Kurzhantel mit Untergriff in die Höhe curlen.',
      'Kurz oben anspannen, kontrolliert absenken.',
    ],
    tips: [
      'Langsamere Kadenz für maximale Isolation',
      'Schulter nicht in die Bewegung einbeziehen',
      'Ideal als letzter Satz für maximalen "Pump"',
    ],
    commonMistakes: [
      'Schulter hochziehen',
      'Ellbogen vom Oberschenkel abheben',
      'Zu schnell ausführen',
    ],
    alternativeIds: ['bizepscurl', 'hammercurl'],
  },
  {
    id: 'kabelcurl',
    name: 'Kabelcurl',
    nameEn: 'Cable Curl',
    category: 'bizeps',
    primaryMuscles: ['Bizeps Brachii'],
    secondaryMuscles: ['Brachialis'],
    equipment: ['kabel'],
    difficulty: 'anfaenger',
    description:
      'Der Kabelcurl bietet konstanten Widerstand durch die gesamte Bewegung – anders als bei freien Gewichten gibt es keinen "toten Punkt". Ideal für vollständige Bizepsbelastung.',
    instructions: [
      'Kabelzug unten einstellen, gerades Attachment oder Seil verwenden.',
      'Stand vor der Maschine, Untergriff am Attachment.',
      'Curlen bis zur Schulter, Ellbogen fixiert.',
      'Kontrolliert zurückführen und Bizeps am unteren Ende dehnen.',
    ],
    tips: [
      'Seil-Attachment für mehr Handgelenk-Komfort',
      'Am unteren Punkt kurz dehnen',
      'Einseitig ausführen für Fokus pro Arm',
    ],
    commonMistakes: [
      'Ellbogen nach vorne schieben',
      'Zu schnell ausführen',
      'Schultern mitbewegen',
    ],
    alternativeIds: ['bizepscurl', 'hammercurl'],
  },

  // ─── TRIZEPS ─────────────────────────────────────────────────────────
  {
    id: 'trizeps_dips',
    name: 'Trizeps-Dips',
    nameEn: 'Tricep Dips',
    category: 'trizeps',
    primaryMuscles: ['Trizeps Brachii'],
    secondaryMuscles: ['Vorderer Deltamuskel', 'Brust'],
    equipment: ['stange', 'koerpergewicht'],
    difficulty: 'fortgeschritten',
    description:
      'Trizeps-Dips sind eine der massewirksamsten Trizepsübungen. Aufrechter Oberkörper legt den Fokus auf den Trizeps. Als Körpergewichtsübung skalierbar mit Zusatzgewicht oder Bändern.',
    instructions: [
      'Greif zwei parallele Stangen, Oberkörper aufrecht halten.',
      'Lass dich kontrolliert absenken, Ellbogen eng am Körper.',
      'Absenken bis Ellbogen 90° erreicht, nicht weiter (Schultern schonen).',
      'Kraftvoll nach oben drücken, Ellbogen am Ende fast gestreckt.',
    ],
    tips: [
      'Aufrechter Oberkörper = Trizeps-Fokus',
      'Schultern nicht hochziehen',
      'Vorgebeugt = Brust-Dips',
    ],
    commonMistakes: [
      'Zu weit absenken',
      'Schultern hochziehen',
      'Schwingen mit dem Körper',
    ],
    alternativeIds: ['skull_crushers', 'trizeps_pushdown'],
  },
  {
    id: 'skull_crushers',
    name: 'Skull Crushers',
    nameEn: 'Skull Crushers / Lying Tricep Extension',
    category: 'trizeps',
    primaryMuscles: ['Trizeps Brachii (langer Kopf)'],
    secondaryMuscles: ['Trizeps (lateraler Kopf)'],
    equipment: ['langhantel', 'kurzhantel'],
    difficulty: 'fortgeschritten',
    description:
      'Skull Crushers sind eine der besten Trizeps-Masseübungen. Sie dehnen den langen Kopf des Trizeps maximal und bauen effektiv Masse auf. Der Name kommt davon, dass die Stange sehr nah am Kopf geführt wird.',
    instructions: [
      'Leg dich auf eine Bank, EZ-Curl-Stange oder Langhantel mit engem Griff.',
      'Starte mit ausgestreckten Armen senkrecht über der Brust.',
      'Nur die Unterarme bewegen – Oberarme bleiben senkrecht.',
      'Stange senken bis sie nahe an die Stirn kommt (nicht aufs Gesicht!).',
      'Trizeps anspannen und Stange zurückdrücken.',
    ],
    tips: [
      'EZ-Curl-Stange für Handgelenk-Komfort',
      'Oberarme bleiben immer senkrecht – kein Schwingen',
      'Langsame exzentrische Phase',
    ],
    commonMistakes: [
      'Oberarme nach vorne oder hinten kippen',
      'Zu weiter Griff',
      'Zu schweres Gewicht',
    ],
    alternativeIds: ['trizeps_dips', 'trizeps_pushdown'],
  },
  {
    id: 'trizeps_pushdown',
    name: 'Trizeps-Pushdown',
    nameEn: 'Tricep Pushdown',
    category: 'trizeps',
    primaryMuscles: ['Trizeps Brachii'],
    secondaryMuscles: [],
    equipment: ['kabel'],
    difficulty: 'anfaenger',
    description:
      'Der Trizeps-Pushdown ist die häufigste Trizeps-Isolationsübung am Kabel. Einfach zu erlernen, wirkungsvoll und perfekt für den Pump am Trainingsende.',
    instructions: [
      'Kabelzug oben einstellen, gerades oder Seil-Attachment.',
      'Stehe aufrecht vor der Maschine, Ellbogen eng am Körper.',
      'Unterarme nach unten strecken bis die Arme gerade sind.',
      'Trizeps am Ende anspannen – kurz halten.',
      'Kontrolliert zurückführen, Ellbogen bleiben am Körper.',
    ],
    tips: [
      'Seil-Attachment = mehr Bewegungsfreiheit und Dehnung',
      'Ellbogen bleiben immer an der Seite – nicht nach oben wandern',
      'Leicht nach vorne lehnen für mehr Stabilität',
    ],
    commonMistakes: [
      'Ellbogen wandern nach vorne/oben',
      'Mit dem Körper schwingen',
      'Nicht volle Streckung am Ende',
    ],
    alternativeIds: ['skull_crushers', 'trizeps_ueberkopf'],
  },
  {
    id: 'trizeps_ueberkopf',
    name: 'Trizeps-Überkopfstreckung',
    nameEn: 'Overhead Tricep Extension',
    category: 'trizeps',
    primaryMuscles: ['Trizeps Brachii (langer Kopf)'],
    secondaryMuscles: [],
    equipment: ['kurzhantel', 'kabel'],
    difficulty: 'anfaenger',
    description:
      'Die Überkopf-Trizepsstreckung dehnt den langen Trizepskopf maximal – anders als Pushdowns, die hauptsächlich den kurzen und lateralen Kopf trainieren. Pflicht für vollständige Trizepsentwicklung.',
    instructions: [
      'Sitz oder steh aufrecht. Kurzhantel mit beiden Händen hinter dem Kopf halten.',
      'Ellbogen zeigen nach oben, nah am Kopf.',
      'Unterarme nach oben strecken – nur die Unterarme bewegen sich.',
      'Trizeps am Ende anspannen, kontrolliert absenken.',
    ],
    tips: [
      'Oberarme ruhig halten – nur Ellbogengelenk öffnet sich',
      'Kabel-Version für gleichmäßigen Widerstand',
      'Maximale Dehnung am unteren Punkt anstreben',
    ],
    commonMistakes: [
      'Ellbogen nach außen kippen',
      'Oberkörper mitbewegen',
      'Keine volle Streckung',
    ],
    alternativeIds: ['trizeps_pushdown', 'skull_crushers'],
  },

  // ─── BEINE ────────────────────────────────────────────────────────────
  {
    id: 'kniebeuge',
    name: 'Kniebeuge',
    nameEn: 'Back Squat',
    category: 'beine',
    primaryMuscles: ['Quadrizeps', 'Gluteus Maximus'],
    secondaryMuscles: ['Hamstrings', 'Adduktoren', 'Rückenstrecker', 'Core'],
    equipment: ['langhantel'],
    difficulty: 'experte',
    description:
      'Die Kniebeuge gilt als die "Mutter aller Übungen". Sie trainiert den gesamten Unterkörper, stärkt Core und Rücken und löst maximale Hormonausschüttung aus. Technisch anspruchsvoll, aber unverzichtbar.',
    instructions: [
      'Stange auf den oberen Rücken (untere Nackenpartie), Schulterblätter zusammenziehen.',
      'Stand etwas breiter als schulterbreit, Zehen 15–30° nach außen.',
      'Tief einatmen, Bauch anspannen (intraabdominaler Druck).',
      'Knie nach außen drücken, Hüfte absenken – wie auf einen Stuhl sitzen.',
      'Tief squatten: Oberschenkel mindestens parallel zum Boden.',
      'Kraftvoll aufstehen, Hüfte nach oben und vorne drücken.',
    ],
    tips: [
      'Knie folgen immer der Zehenrichtung',
      '"Chest up" – Oberkörper aufrecht halten',
      'Mit Luftpolster (Valsalva-Manöver) für Rückenstabilität',
      'Kniebeuge tief – "below parallel" für volle Gluteus-Aktivierung',
    ],
    commonMistakes: [
      'Knie einwärts kollabieren',
      'Fersen heben',
      'Oberkörper zu weit nach vorne kippen',
      'Nicht tief genug squatten',
    ],
    alternativeIds: ['beinpresse', 'bulgarische_kniebeuge'],
  },
  {
    id: 'beinpresse',
    name: 'Beinpresse',
    nameEn: 'Leg Press',
    category: 'beine',
    primaryMuscles: ['Quadrizeps', 'Gluteus'],
    secondaryMuscles: ['Hamstrings', 'Adduktoren'],
    equipment: ['maschine'],
    difficulty: 'anfaenger',
    description:
      'Die Beinpresse ist die sicherste Alternative zur Kniebeuge und erlaubt auch Anfängern schwere Lasten zu bewegen. Fußposition verändert den Fokus: hoch = Gluteus, niedrig = Quadrizeps.',
    instructions: [
      'Sitz in die Maschine, Füße schulterbreit auf der Platte.',
      'Knie beugen bis ca. 90° – nicht zu weit (kein Rundkreuz am unteren Ende).',
      'Platte mit beiden Beinen gleichmäßig wegdrücken.',
      'Knie nie vollständig strecken – leichte Beugung am Ende.',
      'Kontrolliert zurückführen.',
    ],
    tips: [
      'Knie immer in Verlängerung der Zehen',
      'Füße hoch = mehr Gluteus/Hamstrings',
      'Füße niedrig = mehr Quadrizeps',
      'Niemals Gewicht auf den Rücken sinken lassen',
    ],
    commonMistakes: [
      'Knie vollständig strecken',
      'Knie einwärts kollabieren',
      'Zu schweres Gewicht mit eingeschränkter Bewegung',
    ],
    alternativeIds: ['kniebeuge', 'ausfallschritte'],
  },
  {
    id: 'rum_kreuzheben',
    name: 'Rumänisches Kreuzheben',
    nameEn: 'Romanian Deadlift (RDL)',
    category: 'beine',
    primaryMuscles: ['Hamstrings', 'Gluteus Maximus'],
    secondaryMuscles: ['Rückenstrecker', 'Adduktoren'],
    equipment: ['langhantel', 'kurzhantel'],
    difficulty: 'fortgeschritten',
    description:
      'Das rumänische Kreuzheben ist die beste Übung für Hamstrings und Gluteus. Der Unterschied zum klassischen Kreuzheben: Die Knie bleiben fast gestreckt und der Fokus liegt auf der Hüftbeugung.',
    instructions: [
      'Stehe aufrecht mit Langhantel in den Händen (Schulterbreite, Übergriff).',
      'Knie minimal beugen und fixiert halten.',
      'Hüfte nach hinten schieben, Oberkörper neigt sich nach vorne.',
      'Stange am Körper entlanggleiten lassen bis Mitte Unterschenkel.',
      'Maximal in den Hamstrings dehnen.',
      'Hüfte nach vorne drücken und wieder aufrichten.',
    ],
    tips: [
      'Rücken gerade – keine Rundung!',
      'Dehnung in den Hamstrings suchen, nicht Tiefe um der Tiefe willen',
      'Stange bleibt am Körper',
    ],
    commonMistakes: [
      'Rücken runden',
      'Stange zu weit vom Körper',
      'Knie zu stark beugen (wird zur normalen Kniebeuge)',
    ],
    alternativeIds: ['kreuzheben', 'beinbeuger'],
  },
  {
    id: 'ausfallschritte',
    name: 'Ausfallschritte',
    nameEn: 'Lunges',
    category: 'beine',
    primaryMuscles: ['Quadrizeps', 'Gluteus Maximus'],
    secondaryMuscles: ['Hamstrings', 'Adduktoren', 'Core'],
    equipment: ['kurzhantel', 'langhantel', 'koerpergewicht'],
    difficulty: 'anfaenger',
    description:
      'Ausfallschritte trainieren jeden Bein einzeln und verbessern Gleichgewicht, Koordination und Muskelasymmetrien. Ideal für ein vollständiges Beintraining und funktionelle Fitness.',
    instructions: [
      'Stand aufrecht, Hände an den Hüften oder Hanteln in den Händen.',
      'Trete einen großen Schritt nach vorne.',
      'Beuge beide Knie bis das hintere Knie fast den Boden berührt.',
      'Vorderes Knie bleibt über dem Knöchel – nicht über den Fuß hinaus.',
      'Drück dich durch die Ferse des vorderen Beins wieder hoch.',
    ],
    tips: [
      'Schrittlänge anpassen: zu kurz = zu viel Kniestress, zu lang = Gleichgewichtsprobleme',
      'Oberkörper aufrecht halten',
      'Gehende Ausfallschritte für mehr Intensität',
    ],
    commonMistakes: [
      'Vorderes Knie über den Fuß hinaus',
      'Oberkörper nach vorne neigen',
      'Hinteres Knie den Boden berühren lassen',
    ],
    alternativeIds: ['bulgarische_kniebeuge', 'beinpresse'],
  },
  {
    id: 'bulgarische_kniebeuge',
    name: 'Bulgarische Kniebeuge',
    nameEn: 'Bulgarian Split Squat',
    category: 'beine',
    primaryMuscles: ['Quadrizeps', 'Gluteus Maximus'],
    secondaryMuscles: ['Hamstrings', 'Adduktoren'],
    equipment: ['kurzhantel', 'koerpergewicht'],
    difficulty: 'fortgeschritten',
    description:
      'Die bulgarische Kniebeuge ist eine der härtesten Einbeinübungen. Sie isoliert jedes Bein einzeln und baut dabei massiv Kraft und Masse auf, während Dysbalancen korrigiert werden.',
    instructions: [
      'Steh vor einer Bank, trete mit einem Fuß zurück und lege den Rist auf die Bank.',
      'Vorderer Fuß weit genug vorne, damit Knie beim Absenken nicht über den Fuß geht.',
      'Hände an Hüften oder Hanteln halten.',
      'Absenken bis Oberschenkel parallel oder tiefer.',
      'Durch Ferse hochdrücken.',
    ],
    tips: [
      'Langsam anfangen – Gleichgewicht braucht Übung',
      'Fuß nicht zu nah an der Bank',
      'Körpergewicht erst, dann Hanteln',
    ],
    commonMistakes: [
      'Vorderes Knie zu weit vorne',
      'Oberkörper stark nach vorne neigen',
      'Zu schnell zu schwer werden',
    ],
    alternativeIds: ['ausfallschritte', 'kniebeuge'],
  },
  {
    id: 'beinstrecker',
    name: 'Beinstrecker',
    nameEn: 'Leg Extension',
    category: 'beine',
    primaryMuscles: ['Quadrizeps'],
    secondaryMuscles: [],
    equipment: ['maschine'],
    difficulty: 'anfaenger',
    description:
      'Der Beinstrecker isoliert den Quadrizeps komplett. Als Isolationsübung ideal zum Aufwärmen oder Abschluss, nicht als Ersatz für Kniebeugen.',
    instructions: [
      'Sitz in die Maschine, Polster auf den Fußrücken (oberhalb der Knöchel).',
      'Rücken an die Lehne, Oberschenkel vollständig auf der Sitzfläche.',
      'Strecke die Beine bis fast zur vollen Streckung.',
      'Quadrizeps oben anspannen – 1 Sekunde halten.',
      'Kontrolliert absenken, nicht fallen lassen.',
    ],
    tips: [
      'Langsame Bewegung für mehr Muskelaktivierung',
      'Nicht mit Schwung ausführen',
      'Nur als Ergänzung, nicht als Hauptübung',
    ],
    commonMistakes: [
      'Zu schweres Gewicht mit Schwung',
      'Beine vollständig strecken und Knie überdehnen',
      'Rücken von der Lehne abheben',
    ],
    alternativeIds: ['kniebeuge', 'beinpresse'],
  },
  {
    id: 'beinbeuger',
    name: 'Beinbeuger (liegend)',
    nameEn: 'Lying Leg Curl',
    category: 'beine',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Wadenmuskeln'],
    equipment: ['maschine'],
    difficulty: 'anfaenger',
    description:
      'Der Beinbeuger isoliert die Hamstrings – Muskeln, die bei vielen Trainierenden unterentwickelt sind. Starke Hamstrings schützen das Knie und verbessern die Leistung beim Sprint und Springen.',
    instructions: [
      'Leg dich auf die Maschine, Polster auf die Unterschenkel (knapp über den Knöcheln).',
      'Hüfte bleibt auf der Maschine – kein Hochziehen.',
      'Kurle die Beine bis maximal 90° oder mehr Richtung Gesäß.',
      'Hamstrings anspannen, kurz halten.',
      'Kontrolliert strecken, nie fallen lassen.',
    ],
    tips: [
      'Langsame Bewegung, maximale Anspannung',
      'Hüfte auf der Maschine halten',
      'Sitzende Variante für andere Muskelbetonung',
    ],
    commonMistakes: [
      'Hüfte hochziehen',
      'Zu schweres Gewicht',
      'Schnell und unkontrolliert',
    ],
    alternativeIds: ['rum_kreuzheben', 'kniebeuge'],
  },
  {
    id: 'wadenheben',
    name: 'Wadenheben',
    nameEn: 'Standing Calf Raise',
    category: 'beine',
    primaryMuscles: ['Gastrocnemius', 'Soleus (Wade)'],
    secondaryMuscles: [],
    equipment: ['maschine', 'koerpergewicht'],
    difficulty: 'anfaenger',
    description:
      'Wadenheben ist die Kernübung für gut entwickelte Waden. Die Wadenmuskulatur braucht hohe Wiederholungszahlen (15–25) und viel Trainingsvolumen, da sie im Alltag ständig gefordert wird.',
    instructions: [
      'Steh auf dem Rand einer Stufe oder Wadenhebe-Maschine.',
      'Hände an einer Wand oder Stütze für Gleichgewicht.',
      'Auf die Zehenspitzen steigen, Wade maximal anspannen.',
      'Kurz oben halten.',
      'Kontroliert absenken unter Stufenniveau für volle Dehnung.',
    ],
    tips: [
      'Maximale Dehnung am unteren Punkt',
      'Hohe Wdh-Zahlen (15–25) für Hypertrophie',
      'Sitzende Variante betont den Soleus stärker',
    ],
    commonMistakes: [
      'Keine volle Bewegungsreichweite (nur kleine Auf-Bewegungen)',
      'Zu schnell ohne Kontraktion',
      'Knie beugen (Wade entlastet)',
    ],
    alternativeIds: ['beinpresse'],
  },

  // ─── CORE ─────────────────────────────────────────────────────────────
  {
    id: 'plank',
    name: 'Plank (Unterarmstütz)',
    nameEn: 'Plank',
    category: 'core',
    primaryMuscles: ['Transversus Abdominis', 'Rektus Abdominis (Core)'],
    secondaryMuscles: ['Schultern', 'Rückenstrecker', 'Gluteus'],
    equipment: ['koerpergewicht'],
    difficulty: 'anfaenger',
    description:
      'Der Plank ist die fundamentale Core-Übung für isometrische Bauchkraft. Er stärkt die tiefe Bauchmuskulatur, verbessert die Körperhaltung und ist die Basis für alle Rumpf-Stabilisationsübungen.',
    instructions: [
      'Unterarme auf den Boden, Ellbogen unter den Schultern.',
      'Körper bildet eine gerade Linie von Kopf bis Ferse.',
      'Bauch anspannen – Bauchnabel leicht nach innen ziehen.',
      'Hüfte nicht hoch oder durchhängen lassen.',
      'Blick nach unten, Nacken neutral.',
      'Position halten – mit 20 Sek. beginnen, auf 60+ Sek. steigern.',
    ],
    tips: [
      'Qualität vor Zeit – lieber kürzer, aber korrekte Form',
      'Gluteus anspannen für mehr Körperspannung',
      'Atmung nicht anhalten',
    ],
    commonMistakes: [
      'Hüfte hochziehen (Po-Zelt)',
      'Hüfte durchhängen (Hohlkreuz)',
      'Schultern zu den Ohren ziehen',
    ],
    alternativeIds: ['seitenplank', 'ab_wheel'],
  },
  {
    id: 'seitenplank',
    name: 'Seitenplank',
    nameEn: 'Side Plank',
    category: 'core',
    primaryMuscles: ['Obliquus Externus/Internus (schräge Bauchmuskeln)'],
    secondaryMuscles: ['Quadratus Lumborum', 'Schultern'],
    equipment: ['koerpergewicht'],
    difficulty: 'anfaenger',
    description:
      'Der Seitenplank stärkt die seitliche Rumpfmuskulatur (Obliques), die beim normalen Plank kaum trainiert werden. Stark für Drehstabilität und Verletzungsprävention.',
    instructions: [
      'Seitlich auf einem Unterarm abstützen, Ellbogen unter der Schulter.',
      'Beine gestreckt übereinander oder gestaffelt.',
      'Hüfte anheben, bis der Körper eine gerade Linie bildet.',
      'Obere Hand an die Hüfte oder nach oben strecken.',
      'Position halten, dann Seite wechseln.',
    ],
    tips: [
      'Hüfte hoch halten – nicht absacken lassen',
      'Progression: Bein anheben oder Rotation hinzufügen',
      'Beidseitig gleich lang trainieren',
    ],
    commonMistakes: [
      'Hüfte absacken lassen',
      'Körper rotieren',
      'Zu kurze Haltedauer (kein Trainingsreiz)',
    ],
    alternativeIds: ['plank', 'russian_twist'],
  },
  {
    id: 'crunches',
    name: 'Crunches',
    nameEn: 'Crunches',
    category: 'core',
    primaryMuscles: ['Rektus Abdominis (gerader Bauchmuskel)'],
    secondaryMuscles: ['Obliques'],
    equipment: ['koerpergewicht'],
    difficulty: 'anfaenger',
    description:
      'Crunches sind die klassische Bauchmuskelübung und trainieren den geraden Bauchmuskel. Sie sind einfach zu erlernen und können überall durchgeführt werden.',
    instructions: [
      'Leg dich auf den Rücken, Knie gebeugt, Füße auf dem Boden.',
      'Hände locker an den Schläfen – nicht im Nacken ziehen!',
      'Schultergürtel leicht vom Boden abheben, Blick zur Decke.',
      'Kurz oben anspannen – 1 Sekunde.',
      'Kontrolliert absenken, Schultern aber nicht ganz auf den Boden.',
    ],
    tips: [
      'Nacken nicht ziehen – der Bauch macht die Arbeit',
      'Kleine Bewegung, maximale Anspannung',
      'Kinn nicht auf die Brust drücken',
    ],
    commonMistakes: [
      'Nacken mit den Händen nach vorne ziehen',
      'Zu weit aufrichten (wird zum Sit-up)',
      'Zu schnell ohne Kontrolle',
    ],
    alternativeIds: ['plank', 'haengendes_beinheben'],
  },
  {
    id: 'russian_twist',
    name: 'Russian Twist',
    nameEn: 'Russian Twist',
    category: 'core',
    primaryMuscles: ['Obliquus Externus/Internus'],
    secondaryMuscles: ['Rektus Abdominis', 'Hüftbeuger'],
    equipment: ['koerpergewicht', 'kurzhantel'],
    difficulty: 'anfaenger',
    description:
      'Russian Twists trainieren die rotatorische Rumpfkraft – essenziell für Sport und Alltag. Sie entwickeln schlanke, starke Seiten und verbessern die Drehbeweglichkeit.',
    instructions: [
      'Sitz auf dem Boden, Knie angewinkelt, Fersen leicht anheben.',
      'Oberkörper leicht nach hinten (ca. 45°) – Bauch angespannt.',
      'Hände zusammen vor dem Körper (Hantel optional).',
      'Oberkörper nach links drehen, kurz halten, dann nach rechts.',
      'Kontrollierte, gleichmäßige Bewegung.',
    ],
    tips: [
      'Bewegung aus dem Rumpf, nicht nur aus den Armen',
      'Je weiter die Füße vom Boden, desto schwerer',
      'Mit Hantel oder Medizinball steigern',
    ],
    commonMistakes: [
      'Nur die Arme schwingen, Rumpf dreht nicht',
      'Zu schnell und unkontrolliert',
      'Zu weit nach hinten lehnen',
    ],
    alternativeIds: ['seitenplank', 'haengendes_beinheben'],
  },
  {
    id: 'haengendes_beinheben',
    name: 'Hängendes Beinheben',
    nameEn: 'Hanging Leg Raise',
    category: 'core',
    primaryMuscles: ['Rektus Abdominis (unterer Teil)', 'Hüftbeuger'],
    secondaryMuscles: ['Obliques', 'Unterarme (Griff)'],
    equipment: ['stange'],
    difficulty: 'fortgeschritten',
    description:
      'Das hängende Beinheben ist eine der schwierigsten Core-Übungen und trainiert besonders den unteren Bauchereich sowie die Hüftbeuger. Es erfordert viel Rumpfkontrolle.',
    instructions: [
      'An einer Klimmzugstange hängen, Schulterbreite Griffweite.',
      'Schultern aktiv: nicht in die Schultergelenke hängen.',
      'Beine gestreckt (schwerer) oder gebeugt (einfacher) anheben.',
      'Hüfte anheben bis Beine parallel oder höher.',
      'Keine Schwungbewegung – kontrolliert absenken.',
    ],
    tips: [
      'Mit gebeugten Knien beginnen, dann gestreckte Beine',
      'Kein Schwingen – macht die Übung effektiver',
      'Ab-Trainer-Variante für Anfänger',
    ],
    commonMistakes: [
      'Mit Schwung arbeiten',
      'Nicht hoch genug anheben',
      'In die Schultern hängen (Schultern hochziehen)',
    ],
    alternativeIds: ['plank', 'crunches'],
  },
  {
    id: 'ab_wheel',
    name: 'Ab-Wheel-Rollout',
    nameEn: 'Ab Wheel Rollout',
    category: 'core',
    primaryMuscles: ['Rektus Abdominis', 'Transversus Abdominis'],
    secondaryMuscles: ['Latissimus Dorsi', 'Schultern'],
    equipment: ['koerpergewicht'],
    difficulty: 'experte',
    description:
      'Der Ab-Wheel-Rollout ist eine der härtesten Core-Übungen überhaupt. Er trainiert den gesamten Core in Anti-Extension – der Körper verhindert das Durchwölben der Lendenwirbelsäule.',
    instructions: [
      'Knien auf dem Boden, Ab-Wheel in den Händen vor dir.',
      'Bauch stark anspannen.',
      'Wheel nach vorne rollen lassen – Körper streckt sich.',
      'So weit wie möglich rollen ohne den Rücken zu krümmen.',
      'Aus dem Core heraus zurückrollen – kein Schwung.',
    ],
    tips: [
      'Beginne mit kleinen Rollweiten',
      'Progression: kniend → stehend',
      'Rücken darf sich NICHT krümmen – das ist das Signal zu stoppen',
    ],
    commonMistakes: [
      'Rücken krümmt sich',
      'Zu weit rollen ohne Kontrolle',
      'Aus dem Schwung zurückrollen statt aus dem Core',
    ],
    alternativeIds: ['plank', 'haengendes_beinheben'],
  },

  // ─── CARDIO ──────────────────────────────────────────────────────────
  {
    id: 'burpees',
    name: 'Burpees',
    nameEn: 'Burpees',
    category: 'cardio',
    primaryMuscles: ['Ganzkörper'],
    secondaryMuscles: ['Brust', 'Core', 'Beine', 'Schultern'],
    equipment: ['koerpergewicht'],
    difficulty: 'fortgeschritten',
    description:
      'Burpees sind die intensivste Körpergewichtsübung. Sie kombinieren Squat, Liegestütz und Sprung zu einer einzigen Bewegung und treiben die Herzfrequenz extrem schnell nach oben.',
    instructions: [
      'Stand aufrecht, Beine schulterbreit.',
      'In die Hocke gehen, Hände auf den Boden.',
      'Beine nach hinten springen – Liegestützposition.',
      'Eine Liegestütze ausführen (optional, erleichtert ohne).',
      'Beine wieder unter den Körper springen.',
      'Explosiv nach oben springen, Hände über den Kopf klatschen.',
    ],
    tips: [
      'Tempo anfangs langsam – Technik zuerst',
      'Modifiziert: ohne Sprung, ohne Liegestütze',
      '8–10 Wdh. als HIIT-Intervall sehr effektiv',
    ],
    commonMistakes: [
      'Rücken beim Liegestütze-Teil hängen lassen',
      'Kein Sprung am Ende (mindert Intensität)',
      'Zu schnell – Kontrolle verlieren',
    ],
    alternativeIds: ['kniebeuge', 'liegestuetze'],
  },
];

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export function getExerciseByName(name: string): Exercise | undefined {
  const lower = name.toLowerCase().trim();
  return EXERCISES.find(
    (e) => e.name.toLowerCase() === lower || e.nameEn.toLowerCase() === lower
  );
}

export function getExercisesByCategory(category: MuscleCategory): Exercise[] {
  return EXERCISES.filter((e) => e.category === category);
}

export function getAlternatives(exercise: Exercise): Exercise[] {
  return exercise.alternativeIds
    .map((id) => getExerciseById(id))
    .filter((e): e is Exercise => e !== undefined);
}
