// ============================================================
//  Content for the portfolio, sourced from Matteo Vissani's CV
// ============================================================

export const profile = {
  name: 'Matteo Vissani',
  shortName: 'Vissani',
  roleLines: ['Neuroengineer', 'PhD'],
  tagline: 'Neural decoding for adaptive deep brain stimulation',
  subtitle:
    'Postdoctoral Research Fellow · Brain Modulation Lab · Massachusetts General Hospital / Harvard Medical School',
  blurb:
    'I develop adaptive deep brain stimulation methods that read intracranial neural activity in real time and relate it to behavior and clinical symptoms, with the aim of tailoring stimulation to each patient rather than relying on trial and error.',
  location: 'Boston, MA · USA',
  email: 'mvissani@mgh.harvard.edu',
  photo: '/images/matteo.jpg',
  cv: '/files/Matteo-Vissani-CV-2025.pdf',
  links: {
    scholar: 'https://scholar.google.com/citations?user=xYmTzVQAAAAJ&hl=en',
    orcid: 'https://orcid.org/0000-0002-3908-7620',
    linkedin: 'https://www.linkedin.com/in/matteo-vissani',
    github: 'https://github.com/MatteoVissani',
    researchgate: 'https://www.researchgate.net/profile/Matteo-Vissani',
    lab: 'https://www.brainmodulationlab.org/',
  },
}

// Live-ish Google Scholar metrics (snapshot, update by re-reading the profile).
export const scholarStats = {
  citations: 890,
  hIndex: 13,
  i10Index: 16,
  asOf: 'May 2026',
  perYear: [
    { year: 2020, count: 11 },
    { year: 2021, count: 33 },
    { year: 2022, count: 57 },
    { year: 2023, count: 90 },
    { year: 2024, count: 199 },
    { year: 2025, count: 318 },
    { year: 2026, count: 176 },
  ],
}

export const aboutParagraphs = [
  'I am a postdoctoral research fellow in neurosurgery at the Brain Modulation Lab (Massachusetts General Hospital and Harvard Medical School), where I study the intracranial electrophysiology of human behavior and psychiatric disease. In 2026 I received the <strong>NIH K99/R00 Pathway to Independence Award</strong> to develop an independent research program on closed-loop deep brain stimulation for OCD.',
  'I record and analyze intracranial neural activity in patients undergoing awake neurosurgery, and I develop the signal-processing and machine-learning methods needed to interpret it. To date I have contributed to neural data collection in more than 100 patients receiving neurosurgical treatment for movement disorders and psychiatric disease, work that has resulted in peer-reviewed publications and patented neurotechnology.',
  'My broader aim is to make neurostimulation responsive to the individual patient. By relating neural dynamics directly to symptoms and patient state, I work toward personalized, closed-loop therapies that can replace trial-and-error programming for brain disorders that do not respond to conventional treatment.',
]

export type Pillar = {
  title: string
  blurb: string
  glyph: 'pulse' | 'spike' | 'network' | 'wave' | 'code' | 'cross'
  accent: string
  tag: string
}

export const pillars: Pillar[] = [
  {
    title: 'Adaptive & Closed-Loop DBS',
    blurb:
      'Conventional deep brain stimulation is programmed once and then runs continuously. I work with sensing-enabled implants that record neural activity while they stimulate, looking for signals that indicate when a patient improves or worsens. Such signals are a prerequisite for stimulation that adapts on its own, and most of my work in this area focuses on OCD.',
    glyph: 'pulse',
    accent: 'var(--neon-pink)',
    tag: 'OCD · sensing DBS · closed-loop',
  },
  {
    title: 'Neural Decoding & Single-Unit',
    blurb:
      'During surgery I record single neurons in the basal ganglia while patients move and speak, asking what this deep circuit actually computes. My work has shown that subthalamic neurons couple to speech-related cortex and that their bursting activity tracks the quality of reaching movements.',
    glyph: 'spike',
    accent: 'var(--neon-cyan)',
    tag: 'single-unit · speech · movement',
  },
  {
    title: 'Connectomic Neuromodulation',
    blurb:
      'Shifting a stimulation contact by a millimeter can change the clinical outcome, because it engages a different network. Using Lead-DBS and large multi-center datasets, I study which white-matter tracts and circuits carry the therapeutic benefit and which produce side effects.',
    glyph: 'network',
    accent: 'var(--neon-violet)',
    tag: 'connectomes · Lead-DBS · outcomes',
  },
  {
    title: 'Computational Methods',
    blurb:
      'Intracranial recordings are rare, noisy, and acquired under demanding operating-room conditions. Much of my work develops the methods that make the analysis possible: removing speech artifacts from recordings, building decoding pipelines, and contributing to open-source tools such as Lead-DBS.',
    glyph: 'code',
    accent: 'var(--neon-blue)',
    tag: 'ML · signal processing · open tools',
  },
  {
    title: 'Computational Modeling',
    blurb:
      'Recordings describe what happened; models help explain why. I build spiking and oscillator models of the cortico-basal-ganglia loop to study beta synchronization in Parkinson’s disease, together with reinforcement-learning models of how dopamine and serotonin shape decision-making.',
    glyph: 'wave',
    accent: 'var(--neon-amber)',
    tag: 'spiking nets · oscillations · RL',
  },
  {
    title: 'Clinical & Translational',
    blurb:
      'This research is grounded in patient care, in the operating room and the clinic, across movement disorders, OCD, and epilepsy, with earlier work in stroke. Staying close to the clinic keeps the engineering aligned with real clinical needs.',
    glyph: 'cross',
    accent: 'var(--neon-magenta)',
    tag: 'movement · psychiatry · epilepsy',
  },
]

export type Variant = 'spikephase' | 'biomarker' | 'network' | 'burst' | 'epilepsy' | 'sweetspot'

export type Featured = {
  title: string
  venue: string
  year: string
  role: string
  tag: string
  variant: Variant
  blurb: string
  slug: string
}

const scholar = (t: string) =>
  `https://scholar.google.com/scholar?q=${encodeURIComponent(t)}`

export const featured: Featured[] = [
  {
    title: 'Parkinson’s disease as a somato-cognitive action network disorder',
    venue: 'Nature',
    year: '2026',
    role: 'Co-author',
    tag: 'Network · Parkinson’s',
    variant: 'network',
    blurb:
      'A multi-site study reframing Parkinson’s disease as a disorder of the somato-cognitive action network (SCAN), linking the network’s dysfunction to the motor and cognitive symptoms of PD and to the effects of medication and DBS.',
    slug: 'nature-pd-scan',
  },
  {
    title:
      'Subthalamic spikes phase-locked to perisylvian cortex predict speech accuracy',
    venue: 'Nature Communications',
    year: '2025',
    role: 'First author',
    tag: 'Single-unit · Speech',
    variant: 'spikephase',
    blurb:
      'Spike-phase coupling between subthalamic neurons and the posterior perisylvian cortex predicts how accurately people produce speech sounds, offering a window into the basal ganglia’s role in language.',
    slug: 'spike-phase-speech',
  },
  {
    title: 'Toward closed-loop intracranial neurostimulation in OCD',
    venue: 'Biological Psychiatry',
    year: '2023',
    role: 'First author',
    tag: 'Adaptive DBS · Psychiatry',
    variant: 'biomarker',
    blurb:
      'A framework and early evidence for moving OCD therapy from fixed, open-loop stimulation toward symptom-responsive, closed-loop DBS, using sensing-enabled implants to read the patient’s neural state and adapt stimulation to it.',
    slug: 'closed-loop-ocd',
  },
  {
    title: 'Mapping dysfunctional circuits in the frontal cortex using DBS',
    venue: 'Nature Neuroscience',
    year: '2024',
    role: 'Co-author',
    tag: 'Connectomics · Network',
    variant: 'network',
    blurb:
      'A multi-site study that segregates the frontal cortex into dysfunctional circuits using deep brain stimulation, producing a connectomic atlas that links stimulation sites to distinct clinical syndromes.',
    slug: 'frontal-cortex-atlas',
  },
  {
    title:
      'Impaired reach-to-grasp relates to dopamine-dependent subthalamic beta bursts',
    venue: 'npj Parkinson’s Disease',
    year: '2021',
    role: 'First author',
    tag: 'Movement · Biomarker',
    variant: 'burst',
    blurb:
      'Transient beta bursts in the subthalamic nucleus track impaired reaching in Parkinson’s disease, and their occurrence depends on dopaminergic state.',
    slug: 'reach-grasp-beta-bursts',
  },
  {
    title: 'A novel sensing DBS device in drug-resistant epilepsy',
    venue: 'Epilepsia',
    year: '2023',
    role: 'Co-author',
    tag: 'Sensing DBS · Epilepsy',
    variant: 'epilepsy',
    blurb:
      'A first case series of a sensing-enabled DBS device in drug-resistant epilepsy, which consistently identified alpha and beta oscillatory biomarkers across patients.',
    slug: 'sensing-dbs-epilepsy',
  },
  {
    title:
      'Single-neuron structure identifies the DBS target in Tourette syndrome',
    venue: 'Journal of Neural Engineering',
    year: '2019',
    role: 'First author',
    tag: 'Microelectrode · Targeting',
    variant: 'sweetspot',
    blurb:
      'The spatio-temporal structure of single-neuron subthalamic activity is used to identify the optimal stimulation target in Tourette syndrome.',
    slug: 'tourette-dbs-target',
  },
]

export type Category = 'adaptive' | 'decoding' | 'connectomics' | 'methods' | 'modeling' | 'clinical'

export type Pub = {
  authors: string
  title: string
  venue: string
  year: number
  category: Category
  variant: Variant
  slug: string
  link: string
  flagship?: boolean
  pdf?: string
  code?: string
}

type PubOpts = { flagship?: boolean; pdf?: string; code?: string }

const P = (
  slug: string,
  variant: Variant,
  authors: string,
  title: string,
  venue: string,
  year: number,
  category: Category,
  doi?: string,
  opts: PubOpts = {},
): Pub => ({
  slug,
  variant,
  authors,
  title,
  venue,
  year,
  category,
  flagship: opts.flagship,
  pdf: opts.pdf,
  code: opts.code,
  link: doi ? `https://doi.org/${doi}` : scholar(`${title} ${authors}`),
})

const PAPERS = '/papers'
const BML = 'https://github.com/Brain-Modulation-Lab'
const GH = 'https://github.com/MatteoVissani'

export const publications: Pub[] = [
  P('nature-pd-scan', 'network', 'Ren J, Zhang W, Dahmani L, Gordon EM, Li S, …, Vissani M, et al.', 'Parkinson’s disease as a somato-cognitive action network disorder', 'Nature', 2026, 'connectomics', '10.1038/s41586-025-10059-1', { flagship: true }),
  P('spike-phase-speech', 'spikephase', 'Vissani M, Bush A, Lipski WJ, Bullock L, Fischer P, Neudorfer C, et al.', 'Spike-phase coupling of subthalamic neurons to posterior perisylvian cortex predicts speech sound accuracy', 'Nature Communications', 2025, 'decoding', '10.1038/s41467-025-58781-8', { flagship: true, code: `${BML}/code_SPC_ECoG_STN_Speech`, pdf: `${PAPERS}/speech_natcomm_2025.pdf` }),
  P('frontal-cortex-atlas', 'network', 'Hollunder B, Ostrem JL, Sahin IA, Rajamani N, Oxenford S, Butenko K, …, Vissani M, et al.', 'Mapping dysfunctional circuits in the frontal cortex using deep brain stimulation', 'Nature Neuroscience', 2024, 'connectomics', '10.1038/s41593-024-01570-1', { flagship: true }),
  P('speech-artifact-denoising', 'spikephase', 'Peterson V, Vissani M, Luo S, Rabbani Q, Crone NE, Bush A, Richardson RM', 'A supervised data-driven spatial filter denoising method for speech artifacts in intracranial recordings', 'Imaging Neuroscience', 2024, 'methods', '10.1162/imag_a_00301'),
  P('dbs-biophysical-modeling', 'burst', 'Ng PR, Bush A, Vissani M, McIntyre CC, Richardson RM', 'Biophysical principles and computational modeling of deep brain stimulation', 'Neuromodulation', 2024, 'modeling', '10.1016/j.neurom.2023.04.471'),
  P('closed-loop-ocd', 'biomarker', 'Vissani M, Nanda P, Bush A, Neudorfer C, Dougherty D, Richardson RM', 'Toward closed-loop intracranial neurostimulation in obsessive-compulsive disorder', 'Biological Psychiatry', 2023, 'adaptive', '10.1016/j.biopsych.2022.07.003', { flagship: true, code: `${BML}/Paper_Vissani_et_al_OCDPercept` }),
  P('sensing-dbs-epilepsy', 'epilepsy', 'Chua MMJ, Vissani M, Liu DD, Schaper FLWVJ, Warren AEL, Caston R, et al.', 'Initial case series of a novel sensing deep brain stimulation device in drug-resistant epilepsy', 'Epilepsia', 2023, 'adaptive', '10.1111/epi.17722', { flagship: true }),
  P('lead-dbs-v3', 'network', 'Neudorfer C, Butenko K, Oxenford S, Rajamani N, Achtzehn J, Goede L, …, Vissani M, et al.', 'Lead-DBS v3.0: mapping deep brain stimulation effects to local anatomy and global networks', 'NeuroImage', 2023, 'methods', '10.1016/j.neuroimage.2023.119862'),
  P('focal-epilepsy-layers', 'epilepsy', 'Panarese A, Vissani M, Meneghetti N, Vannini E, Cracchiolo M, Micera S, Caleo M, Mazzoni A, Restani L', 'Disruption of layer-specific visual processing in a model of focal neocortical epilepsy', 'Cerebral Cortex', 2023, 'modeling', '10.1093/cercor/bhac335'),
  P('juvenile-hd-stn-dbs', 'sweetspot', 'Kaymak A, Vissani M, Lenge M, Melani F, Fino E, Cappelletto P, et al.', 'Patterns of neural activity and clinical outcomes in a juvenile Huntington’s disease patient undergoing STN DBS', 'Deep Brain Stimulation', 2023, 'clinical', '10.1016/j.jdbs.2023.03.001'),
  P('stroke-motor-recovery', 'biomarker', 'Lassi M, Dalise S, Bandini A, Spina V, Azzollini V, Vissani M, Micera S, Mazzoni A, Chisari C', 'Neurophysiological underpinnings of an intensive protocol for upper-limb motor recovery in stroke', 'Eur. J. Phys. Rehabil. Med.', 2023, 'clinical', '10.23736/S1973-9087.23.07922-4'),
  P('peripersonal-space-stroke', 'network', 'Bassolino M, Franza M, Guanziroli E, Sorrentino G, Canzoneri E, Colombo M, …, Vissani M, et al.', 'Body and peripersonal space representations in chronic stroke patients with upper-limb motor deficits', 'Brain Communications', 2022, 'clinical', '10.1093/braincomms/fcac179'),
  P('meta-rl-cognitive-control', 'network', 'Robertazzi F, Vissani M, Schillaci G, Falotico E', 'Brain-inspired meta-reinforcement-learning cognitive control in conflictual decision-making for artificial agents', 'Neural Networks', 2022, 'modeling', '10.1016/j.neunet.2022.06.020', { code: `${GH}/Robertazzi_et_al_code_BG_MetaLearning_DecisionMakingTasks_NeuralNetworks_2022` }),
  P('impulsivity-firing-regularity', 'spikephase', 'Vissani M, Micheli F, Pecchioli G, Ramat S, Mazzoni A', 'Impulsivity is associated with firing regularity in parkinsonian ventral subthalamic nucleus', 'Ann. Clinical & Translational Neurology', 2022, 'decoding', '10.1002/acn3.51530'),
  P('impulsivity-single-unit', 'spikephase', 'Micheli F, Vissani M, Pecchioli G, Terenzi F, Ramat S, Mazzoni A', 'Impulsivity markers in parkinsonian subthalamic single-unit activity', 'Movement Disorders', 2021, 'decoding', '10.1002/mds.28497', { pdf: `${PAPERS}/Micheli_ICB_STN_PD_MD_2021.pdf` }),
  P('reach-grasp-beta-bursts', 'burst', 'Vissani M, Palmisano C, Volkmann J, Pezzoli G, Micera S, Isaias IU, Mazzoni A', 'Impaired reach-to-grasp kinematics in parkinsonian patients relates to dopamine-dependent subthalamic beta bursts', 'npj Parkinson’s Disease', 2021, 'decoding', '10.1038/s41531-021-00187-6', { flagship: true }),
  P('dbs-open-challenges', 'sweetspot', 'Vissani M, Isaias IU, Mazzoni A', 'Deep brain stimulation: a review of the open neural engineering challenges', 'Journal of Neural Engineering', 2020, 'adaptive', '10.1088/1741-2552/abb581', { pdf: `${PAPERS}/Vissani_2020_J._Neural_Eng._17_051002.pdf` }),
  P('gait-initiation-pd', 'biomarker', 'Palmisano C, Brandt G, Vissani M, Pozzi NG, Canessa A, Brumberg J, et al.', 'Gait initiation in Parkinson’s disease: impact of dopamine depletion and initial stance condition', 'Frontiers in Bioeng. & Biotech.', 2020, 'clinical', '10.3389/fbioe.2020.00137', { pdf: `${PAPERS}/Vissani_Gait_initiation_Front.pdf` }),
  P('tourette-dbs-target', 'sweetspot', 'Vissani M, Cordella R, Micera S, Eleopra R, Romito LM, Mazzoni A', 'Spatio-temporal structure of single-neuron subthalamic activity identifies DBS target for Tourette syndrome', 'Journal of Neural Engineering', 2019, 'decoding', '10.1088/1741-2552/ab37b4', { flagship: true, pdf: `${PAPERS}/Vissani_Spatio-temporalneuronalactivitystructureinTouretteSTN-Jneuraleng2019_DEFF.pdf` }),
  P('tms-hand-perception', 'biomarker', 'Franza M, Sorrentino G, Vissani M, Serino A, Blanke O, Bassolino M', 'Hand perceptions induced by single-pulse TMS over the primary motor cortex', 'Brain Stimulation', 2019, 'clinical', '10.1016/j.brs.2018.12.972', { pdf: `${PAPERS}/Vissani_Hand_Perception_TMS_BrainStim.pdf` }),
]

export const categoryLabels: Record<Category, string> = {
  adaptive: 'Adaptive & Closed-Loop DBS',
  decoding: 'Neural Decoding & Single-Unit',
  connectomics: 'Connectomic Neuromodulation',
  methods: 'Computational Methods',
  modeling: 'Computational Modeling',
  clinical: 'Clinical & Translational',
}

export const findPub = (slug: string) => publications.find((p) => p.slug === slug)

// papers that have an interactive "Explore the data" 3D showcase on their page
export const explorableSlugs = ['spike-phase-speech']
export const hasExplorer = (slug: string) => explorableSlugs.includes(slug)

export type Award = {
  year: string
  title: string
  org: string
}

export const awards: Award[] = [
  { year: '2026', title: 'NIH K99/R00 Pathway to Independence Award', org: 'National Institute of Mental Health (NIMH) · 1K99MH144561' },
  { year: '2024', title: 'BRAIN Initiative Scholar Spotlight Award', org: 'National Institutes of Health (NIH)' },
  { year: '2023', title: 'Michael Jenike Young Investigator Award', org: 'International OCD Foundation (IOCDF)' },
  { year: '2022', title: 'Best Contribution Award', org: 'Workshop on AI & Smart Systems, Scuola Superiore Sant’Anna' },
  { year: '2021', title: 'Massimo Grattarola Award', org: 'GNB · best Italian PhD thesis in bioengineering' },
  { year: '2021', title: 'Ph.D. Awarded with Highest Honor', org: 'Scuola Superiore Sant’Anna' },
  { year: '2017', title: 'Ph.D. Fellowship · top 1% of 100+ candidates', org: 'Scuola Superiore Sant’Anna' },
]

export type Teaching = {
  period: string
  course: string
  detail: string
  place: string
  notes?: { label: string; href: string }[]
}

export const teaching: Teaching[] = [
  {
    period: '2017–2021',
    course: 'Information Theory & Neural Modeling',
    detail: 'During my PhD I taught a graduate course covering the mathematical theory of the integrate-and-fire neuron, with detailed formalism and extensions, together with the foundations of information theory, focusing on entropy and mutual information.',
    place: 'Scuola Superiore Sant’Anna, Pisa',
    notes: [
      { label: 'Integrate-and-Fire Neuron', href: '/lectures/Vissani-Lecture-Integrate-and-Fire-Neuron.pdf' },
      { label: 'Entropy & Mutual Information', href: '/lectures/Vissani-Lecture-Entropy-and-Mutual-Information.pdf' },
    ],
  },
]

export type TutoringLink = { name: string; href: string }
export type TutContent = {
  langName: string
  eyebrow: string
  title: string
  accent: string
  pitch: string
  blurb: string
  credentials: string[]
  subjects: string[]
  subjectAreas: { name: string; topics: string[] }[]
  approach: { step: string; title: string; text: string }[]
  examsLabel: string
  examsBlurb: string
  faqs: { q: string; a: string }[]
  metaLabel: string
  labels: {
    whatITeach: string
    howWeWork: string
    admissionPrep: string
    admissionCard: string
    admissionNote: string
    goodToKnow: string
    bookTitle: string
    bookText: string
    scanCap: string
    emailBtn: string
  }
}

const tutoringEN: TutContent = {
  langName: 'English',
  eyebrow: 'Private tutoring',
  title: 'From stuck to fluent in maths, physics and engineering',
  accent: 'fluent',
  pitch:
    'Clear, patient, one-to-one lessons that build the deep understanding exams actually reward, taught by a researcher who uses this maths and physics every day.',
  blurb:
    'Beyond the lab, I help high-school and university students truly master mathematics, physics, and engineering. Not by memorising recipes, but by building real intuition from first principles and earning fluency through hard problems we solve together. I am a PhD-level tutor who still remembers exactly what it feels like when an idea finally clicks. Lessons online or in person, in Italian or English.',
  credentials: [
    'PhD, awarded with highest honour',
    'Published in Nature and Nature Communications',
    'Taught graduate-level courses',
    'Researcher at MGH / Harvard',
  ],
  subjects: ['Mathematics', 'Physics', 'Engineering'],
  subjectAreas: [
    { name: 'Mathematics', topics: ['Calculus and real analysis', 'Linear algebra', 'Differential equations', 'Probability and statistics'] },
    { name: 'Physics', topics: ['Classical mechanics', 'Electromagnetism', 'Thermodynamics and waves', 'Modern physics'] },
    { name: 'Engineering', topics: ['Signals and systems', 'Control and dynamics', 'Circuits and electronics', 'Numerical methods · MATLAB / Python'] },
  ],
  approach: [
    { step: '01', title: 'Find the real gap', text: 'We pinpoint exactly where the understanding breaks down. Not just the wrong answer, but the shaky idea underneath it.' },
    { step: '02', title: 'Rebuild the intuition', text: 'Then we reconstruct it from first principles, with the visual, worked-through explanations that make a concept finally click and stay.' },
    { step: '03', title: 'Make it automatic', text: 'We drill it on real problems and past papers until you can do it quickly, cleanly, and calmly under exam pressure.' },
  ],
  examsLabel: 'University admission prep',
  examsBlurb:
    'I also coach for the toughest university admission exams, where success rewards far more than knowing the maths. It rewards reasoning fast, writing clean arguments, and staying calm under pressure. We drill past papers, decode every question type, and turn exam-day nerves into a clear plan of attack.',
  faqs: [
    { q: 'Online or in person?', a: 'Both. Most lessons run online through Preply or Superprof with a shared interactive whiteboard; in-person can be arranged locally.' },
    { q: 'Which languages?', a: 'Italian and English, including the technical vocabulary in both. Handy if you study in one language and think in the other.' },
    { q: 'Can we start with a trial?', a: 'Yes. Book a first lesson on Preply or Superprof so we can map your goals before settling on a plan.' },
    { q: 'Do you prep for admission tests?', a: 'Yes: STEP, TMUA, MAT and the Italian TOLC, with past-paper drills and exam strategy. Start a few months ahead for the best results.' },
  ],
  metaLabel: 'High-school and university level · Italian and English',
  labels: {
    whatITeach: 'What I teach',
    howWeWork: 'How we’ll work together',
    admissionPrep: 'University admission prep',
    admissionCard: 'Admission tests',
    admissionNote: 'Past-paper drills plus exam strategy for the toughest entrance exams.',
    goodToKnow: 'Good to know',
    bookTitle: 'Book your first lesson',
    bookText: 'Tell me your goal: a tricky course, a looming exam, or an admission test, and we’ll build a plan around it.',
    scanCap: 'Scan to book on Preply',
    emailBtn: 'Email me',
  },
}

const tutoringIT: TutContent = {
  langName: 'Italiano',
  eyebrow: 'Ripetizioni private',
  title: 'Da bloccato a sicuro in matematica, fisica e ingegneria',
  accent: 'sicuro',
  pitch:
    'Lezioni individuali chiare e pazienti, che costruiscono la comprensione profonda che gli esami premiano davvero. Le tiene un ricercatore che usa questa matematica e questa fisica ogni giorno.',
  blurb:
    'Oltre alla ricerca, aiuto studenti di scuola superiore e università a padroneggiare davvero la matematica, la fisica e l’ingegneria. Non imparando formule a memoria, ma costruendo una vera intuizione a partire dai principi primi e acquisendo padronanza risolvendo insieme problemi difficili. Sono un tutor con un dottorato di ricerca che ricorda ancora bene cosa si prova quando un’idea finalmente si accende. Lezioni online o in presenza, in italiano o in inglese.',
  credentials: [
    'Dottorato di ricerca con lode',
    'Pubblicato su Nature e Nature Communications',
    'Ha insegnato corsi universitari magistrali',
    'Ricercatore al MGH / Harvard',
  ],
  subjects: ['Matematica', 'Fisica', 'Ingegneria'],
  subjectAreas: [
    { name: 'Matematica', topics: ['Analisi e calcolo', 'Algebra lineare', 'Equazioni differenziali', 'Probabilità e statistica'] },
    { name: 'Fisica', topics: ['Meccanica classica', 'Elettromagnetismo', 'Termodinamica e onde', 'Fisica moderna'] },
    { name: 'Ingegneria', topics: ['Segnali e sistemi', 'Controlli e dinamica', 'Circuiti ed elettronica', 'Metodi numerici · MATLAB / Python'] },
  ],
  approach: [
    { step: '01', title: 'Trovare il vero punto debole', text: 'Individuiamo con precisione dove si inceppa la comprensione. Non solo la risposta sbagliata, ma l’idea incerta che ci sta sotto.' },
    { step: '02', title: 'Ricostruire l’intuizione', text: 'Poi la ricostruiamo dai principi primi, con spiegazioni visive e svolte passo dopo passo, quelle che fanno scattare e restare un concetto.' },
    { step: '03', title: 'Renderla automatica', text: 'La alleniamo su problemi veri e prove d’esame finché non la esegui in fretta, in modo pulito e con calma sotto pressione.' },
  ],
  examsLabel: 'Preparazione ai test di ammissione',
  examsBlurb:
    'Preparo anche ai test di ammissione universitari più impegnativi, dove non basta sapere la matematica: conta ragionare in fretta, scrivere argomentazioni pulite e restare lucidi sotto pressione. Lavoriamo sulle prove degli anni precedenti, analizziamo ogni tipo di quesito e trasformiamo l’ansia da esame in un piano d’azione chiaro.',
  faqs: [
    { q: 'Online o in presenza?', a: 'Entrambi. La maggior parte delle lezioni si svolge online su Preply o Superprof con una lavagna interattiva condivisa; in presenza si può organizzare in zona.' },
    { q: 'In quali lingue?', a: 'Italiano e inglese, compreso il lessico tecnico in entrambe. Utile se studi in una lingua e ragioni nell’altra.' },
    { q: 'Possiamo iniziare con una prova?', a: 'Sì. Prenota una prima lezione su Preply o Superprof, così definiamo i tuoi obiettivi prima di scegliere un percorso.' },
    { q: 'Prepari ai test di ammissione?', a: 'Sì: STEP, TMUA, MAT e il TOLC italiano, con esercizi sulle prove passate e strategia d’esame. Meglio iniziare qualche mese prima.' },
  ],
  metaLabel: 'Livello scuola superiore e università · in italiano e in inglese',
  labels: {
    whatITeach: 'Cosa insegno',
    howWeWork: 'Come lavoreremo insieme',
    admissionPrep: 'Preparazione ai test di ammissione',
    admissionCard: 'Test di ammissione',
    admissionNote: 'Esercizi sulle prove passate e strategia d’esame per i test d’ingresso più difficili.',
    goodToKnow: 'Buono a sapersi',
    bookTitle: 'Prenota la tua prima lezione',
    bookText: 'Dimmi il tuo obiettivo: un corso ostico, un esame imminente o un test di ammissione, e costruiamo un piano su misura.',
    scanCap: 'Scansiona per prenotare su Preply',
    emailBtn: 'Scrivimi',
  },
}

export const tutoring = {
  exams: ['STEP', 'TMUA', 'MAT', 'TOLC'],
  languages: ['Italian', 'English'],
  email: 'matteo.vissani7@gmail.com',
  qr: '/images/preply-qr.png',
  links: [
    { name: 'Preply', href: 'https://preply.in/MATTEO7EN3811745210?ts=17815293' },
    { name: 'Superprof', href: 'https://www.superprof.com/ir/43216447-0e8c1c' },
  ] as TutoringLink[],
  en: tutoringEN,
  it: tutoringIT,
  // SEO for the standalone /tutoring landing page.
  seo: {
    title: 'Private maths, physics & engineering tutor (EN/IT) · Matteo Vissani',
    description:
      'PhD-level online and in-person tutoring in mathematics, physics and engineering for high-school and university students, in English and Italian. Admission-test prep for STEP, TMUA, MAT and TOLC. Ripetizioni private di matematica, fisica e ingegneria, in italiano e in inglese.',
  },
}

export type Mentoring = { program: string; since: string; detail: string; href: string }

export const mentoring: Mentoring[] = [
  {
    program: 'LeadTheFuture',
    since: 'Since 2024',
    detail: 'STEM mentor in a free program that connects Italian students with researchers and professionals working abroad.',
    href: 'https://leadthefuture.tech/',
  },
  {
    program: 'ISSNAF',
    since: 'Since 2025',
    detail: 'Mentor in the program of the Italian Scientists and Scholars in North America Foundation (ISSNAF).',
    href: 'https://www.issnaf.org/mentoring-programs',
  },
]

export type Talk = {
  year: string
  title: string
  venue: string
  place: string
  kind: 'Invited' | 'Conference' | 'Plenary'
  highlight?: boolean
}

export const talks: Talk[] = [
  { year: '2025', title: 'Toward responsive, closed-loop deep brain stimulation for OCD', venue: 'IOCDF Research Symposium', place: 'Chicago, IL', kind: 'Conference' },
  { year: '2024', title: 'Electrophysiological biomarkers for sensing-enabled DBS in OCD', venue: 'NIH BRAIN Initiative Conference · Scholar Spotlight Plenary', place: 'Bethesda, MD', kind: 'Plenary', highlight: true },
  { year: '2024', title: 'A candidate responsive biomarker in sensing-enabled DBS for OCD', venue: 'Congress of Neurological Surgeons Annual Meeting', place: 'Houston, TX', kind: 'Conference' },
  { year: '2024', title: 'Biomarker-guided DBS for obsessive-compulsive disorder', venue: 'Biennial Psychiatric Neurosurgery Symposium', place: 'Nashville, TN', kind: 'Conference' },
  { year: '2024', title: 'Distinct roles of subthalamic neuron coupling to speech-related cortical areas', venue: 'Joint BWH–MGH Neurosurgery Translational Science Series', place: 'Boston, MA', kind: 'Invited' },
  { year: '2022', title: 'Speech-related spike-phase coupling of subthalamic neurons to the human cortex', venue: 'Human Single Neuron Conference', place: 'UCSF, San Francisco, CA', kind: 'Conference' },
]

// Media / press where the research is featured
export type Media = { label: string; org: string; href: string }
export const media: Media[] = [
  {
    label: 'Behind the paper: “Synchrony in Speech”',
    org: 'Springer Nature Research Communities · authored feature on how deep brain regions coordinate during speaking',
    href: 'https://communities.springernature.com/posts/synchrony-in-speech-revealing-how-deep-brain-regions-communicate-during-speaking',
  },
  {
    label: 'Sensing-enabled DBS biomarkers for OCD',
    org: 'International OCD Foundation · featured Jenike Young Investigator research',
    href: 'https://iocdf.org/recipients/electrophysiological-biomarker-characterization-in-sensing-enabled-deep-brain-stimulation-for-obsessive-compulsive-disorder/',
  },
]

export type EduItem = {
  period: string
  degree: string
  place: string
  detail?: string
}

export const education: EduItem[] = [
  { period: '2017–2021', degree: 'Ph.D. in Biorobotics & Neuroengineering', place: 'Scuola Superiore Sant’Anna, Pisa (IT)', detail: 'Highest Honor · Advisors: A. Mazzoni, S. Micera' },
  { period: '2014–2017', degree: 'M.Sc. in Biomedical Engineering', place: 'University of Bologna (IT)' },
  { period: '2011–2014', degree: 'B.Sc. in Biomedical Engineering', place: 'Marche Polytechnic University, Ancona (IT)' },
]

export type Repo = { name: string; desc: string; href: string; lang?: string }
export const repos: Repo[] = [
  { name: 'code_SPC_ECoG_STN_Speech', lang: 'MATLAB', desc: 'Time-resolved spike-phase coupling pipeline (the interactive toolkit above is a browser port).', href: 'https://github.com/Brain-Modulation-Lab/code_SPC_ECoG_STN_Speech' },
]
export const codeProfileUrl = 'https://github.com/MatteoVissani'

export type NavChild = { id: string; label: string }
export type NavLink = { id: string; label: string; href?: string; children?: NavChild[] }

export const navLinks: NavLink[] = [
  { id: 'about', label: 'About' },
  {
    id: 'research',
    label: 'Research',
    children: [
      { id: 'research', label: 'Lines of research' },
      { id: 'work', label: 'Selected work' },
      { id: 'publications', label: 'Publications' },
      { id: 'awards', label: 'Awards' },
      { id: 'talks', label: 'Talks & media' },
    ],
  },
  { id: 'teaching', label: 'Teaching' },
  { id: 'tutoring', label: 'Tutoring' },
  { id: 'software', label: 'Software' },
  { id: 'contact', label: 'Contact' },
]
