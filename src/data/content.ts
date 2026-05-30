// ============================================================
//  Content for the portfolio — sourced from Matteo Vissani's CV
// ============================================================

export const profile = {
  name: 'Matteo Vissani',
  shortName: 'Vissani',
  roleLines: ['Neuroengineer', 'PhD'],
  tagline: 'Decoding the brain’s electrical code',
  subtitle:
    'Postdoctoral Research Fellow · Brain Modulation Lab · Massachusetts General Hospital / Harvard Medical School',
  blurb:
    'I build the next generation of adaptive deep brain stimulation therapies — reading intracranial neural activity in real time and linking it directly to behavior and clinical symptoms, so stimulation can finally move beyond trial-and-error.',
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

// Live-ish Google Scholar metrics (snapshot — update by re-reading the profile).
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
  'I am a postdoctoral research fellow in neurosurgery at the Brain Modulation Lab (MGH / Harvard Medical School), where I investigate the intracranial electrophysiological signatures of human behavior and psychiatric disease. In 2025 I received the <strong>NIH K99/R00 Pathway to Independence Award</strong> to launch my own research program on closed-loop deep brain stimulation for OCD.',
  'My work spans the full arc of translational neurotechnology — from intraoperative recordings in the operating room, through machine-learning and signal-processing pipelines, to peer-reviewed discovery and patented hardware. I have led neural data collection in more than 100 movement-disorder and psychiatric surgery patients.',
  'The thread through all of it: making neurostimulation intelligent. By directly linking neural dynamics to symptoms and movement, I aim to replace empirical trial-and-error with personalized, data-driven, closed-loop therapies for otherwise treatment-refractory brain disorders.',
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
      'Conventional deep brain stimulation runs on fixed, manually-programmed settings. I work on sensing-enabled DBS — using devices that chronically record local field potentials (e.g. Medtronic Percept) to find neural correlates of clinical state, a prerequisite for stimulation that responds to the patient. My main focus here is obsessive-compulsive disorder.',
    glyph: 'pulse',
    accent: 'var(--neon-pink)',
    tag: 'OCD · sensing DBS · closed-loop',
  },
  {
    title: 'Neural Decoding & Single-Unit',
    blurb:
      'During awake neurosurgery I record single neurons and local field potentials from the human basal ganglia together with cortical signals, and relate that activity to behavior — how subthalamic spiking couples to cortex during speech, and how beta-band activity tracks movement and impulsivity in Parkinson’s disease.',
    glyph: 'spike',
    accent: 'var(--neon-cyan)',
    tag: 'single-unit · speech · movement',
  },
  {
    title: 'Connectomic Neuromodulation',
    blurb:
      'A DBS contact’s effect depends on the brain-wide network it engages, not only its local target. I contribute to multi-site, connectome-based analyses (Lead-DBS) that relate stimulation sites to distributed circuits and clinical outcomes across disorders — including work mapping frontal-cortex dysfunction and Parkinson’s network pathology.',
    glyph: 'network',
    accent: 'var(--neon-violet)',
    tag: 'connectomes · Lead-DBS · outcomes',
  },
  {
    title: 'Computational Methods',
    blurb:
      'Human intracranial datasets are multi-stream, noisy and hard to acquire. I develop the analysis methods and infrastructure that make them usable — machine-learning denoising of speech artifacts in neural recordings, spectral and decoding pipelines, reproducible data management, and contributions to open tools such as Lead-DBS.',
    glyph: 'code',
    accent: 'var(--neon-blue)',
    tag: 'ML · signal processing · open tools',
  },
  {
    title: 'Computational Modeling',
    blurb:
      'Alongside the recordings, I build models of the cortico-basal-ganglia circuit — spiking and oscillator networks of beta synchronization in Parkinson’s disease, and reinforcement-learning models of how neuromodulators shape decision-making — to test mechanisms that data alone cannot resolve.',
    glyph: 'wave',
    accent: 'var(--neon-amber)',
    tag: 'spiking nets · oscillations · RL',
  },
  {
    title: 'Clinical & Translational',
    blurb:
      'This work happens with patients, in the operating room and the clinic — across movement disorders, OCD and epilepsy, with earlier projects on stroke and sensorimotor rehabilitation. The goal is to keep the engineering anchored to questions that matter clinically.',
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
      'A landmark multi-site study reframing Parkinson’s disease as a disorder of the somato-cognitive action network (SCAN) — linking the network’s dysfunction to the diverse motor and cognitive symptoms of PD and to how medication and DBS act.',
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
      'Discovered that spike-phase coupling between subthalamic neurons and the posterior perisylvian cortex predicts how accurately people produce speech sounds — a window into the basal ganglia’s role in language.',
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
      'A framework and early evidence for moving OCD therapy from fixed, open-loop stimulation toward symptom-responsive, closed-loop DBS — using sensing-enabled implants to read the patient’s neural state and adapt stimulation to it.',
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
      'A multi-site effort segregating the frontal cortex into dysfunctional circuits via deep brain stimulation — a connectomic atlas linking stimulation sites to distinct clinical syndromes.',
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
      'Showed that transient high-frequency beta bursts in the subthalamic nucleus track impaired reaching in Parkinson’s patients — and that they depend on dopaminergic state.',
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
      'First case series of a novel sensing-enabled DBS device in drug-resistant epilepsy, consistently identifying alpha/beta oscillatory biomarkers across patients.',
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
      'Used the spatio-temporal structure of single-neuron subthalamic activity to pinpoint the optimal stimulation target in anesthetized Tourette syndrome patients.',
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
  figure?: string
  figCaption?: string
}

type PubOpts = { flagship?: boolean; pdf?: string; code?: string; figure?: string; figCaption?: string }

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
  figure: opts.figure,
  figCaption: opts.figCaption,
  link: doi ? `https://doi.org/${doi}` : scholar(`${title} ${authors}`),
})

const IMG = '/images'

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
  P('impulsivity-single-unit', 'spikephase', 'Micheli F, Vissani M, Pecchioli G, Terenzi F, Ramat S, Mazzoni A', 'Impulsivity markers in parkinsonian subthalamic single-unit activity', 'Movement Disorders', 2021, 'decoding', '10.1002/mds.28497', { pdf: `${PAPERS}/Micheli_ICB_STN_PD_MD_2021.pdf`, figure: `${IMG}/projects-ICB_PD.png`, figCaption: 'Single-unit firing markers of impulsivity in the parkinsonian subthalamic nucleus.' }),
  P('reach-grasp-beta-bursts', 'burst', 'Vissani M, Palmisano C, Volkmann J, Pezzoli G, Micera S, Isaias IU, Mazzoni A', 'Impaired reach-to-grasp kinematics in parkinsonian patients relates to dopamine-dependent subthalamic beta bursts', 'npj Parkinson’s Disease', 2021, 'decoding', '10.1038/s41531-021-00187-6', { flagship: true, figure: `${IMG}/projects-reach-grasp.png`, figCaption: 'Transient subthalamic beta bursts scale with reach-to-grasp kinematics and depend on dopaminergic state.' }),
  P('dbs-open-challenges', 'sweetspot', 'Vissani M, Isaias IU, Mazzoni A', 'Deep brain stimulation: a review of the open neural engineering challenges', 'Journal of Neural Engineering', 2020, 'adaptive', '10.1088/1741-2552/abb581', { pdf: `${PAPERS}/Vissani_2020_J._Neural_Eng._17_051002.pdf`, figure: `${IMG}/projects-reviewDBS.png`, figCaption: 'A map of the open neural-engineering challenges for deep brain stimulation.' }),
  P('gait-initiation-pd', 'biomarker', 'Palmisano C, Brandt G, Vissani M, Pozzi NG, Canessa A, Brumberg J, et al.', 'Gait initiation in Parkinson’s disease: impact of dopamine depletion and initial stance condition', 'Frontiers in Bioeng. & Biotech.', 2020, 'clinical', '10.3389/fbioe.2020.00137', { pdf: `${PAPERS}/Vissani_Gait_initiation_Front.pdf`, figure: `${IMG}/projects-gait.png`, figCaption: 'Gait-initiation biomechanics and the impact of dopamine depletion in Parkinson’s disease.' }),
  P('tourette-dbs-target', 'sweetspot', 'Vissani M, Cordella R, Micera S, Eleopra R, Romito LM, Mazzoni A', 'Spatio-temporal structure of single-neuron subthalamic activity identifies DBS target for Tourette syndrome', 'Journal of Neural Engineering', 2019, 'decoding', '10.1088/1741-2552/ab37b4', { flagship: true, pdf: `${PAPERS}/Vissani_Spatio-temporalneuronalactivitystructureinTouretteSTN-Jneuraleng2019_DEFF.pdf`, figure: `${IMG}/jneab37b4f04_hr.jpg`, figCaption: 'Spatio-temporal structure of single-neuron subthalamic activity used to identify the DBS target.' }),
  P('tms-hand-perception', 'biomarker', 'Franza M, Sorrentino G, Vissani M, Serino A, Blanke O, Bassolino M', 'Hand perceptions induced by single-pulse TMS over the primary motor cortex', 'Brain Stimulation', 2019, 'clinical', '10.1016/j.brs.2018.12.972', { pdf: `${PAPERS}/Vissani_Hand_Perception_TMS_BrainStim.pdf`, figure: `${IMG}/projects-tms_hand.png`, figCaption: 'Changes in hand perception induced by single-pulse TMS over the primary motor cortex.' }),
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

export type Award = {
  year: string
  title: string
  org: string
}

export const awards: Award[] = [
  { year: '2025', title: 'NIH K99/R00 Pathway to Independence Award', org: 'National Institute of Mental Health (NIMH) · 1K99MH144561' },
  { year: '2024', title: 'BRAIN Initiative Scholar Spotlight Award', org: 'National Institutes of Health (NIH)' },
  { year: '2023', title: 'Michael Jenike Young Investigator Award', org: 'International OCD Foundation (IOCDF)' },
  { year: '2022', title: 'Best Contribution Award', org: 'Workshop on AI & Smart Systems, Scuola Superiore Sant’Anna' },
  { year: '2021', title: 'Massimo Grattarola Award', org: 'GNB — best Italian PhD thesis in bioengineering' },
  { year: '2021', title: 'Ph.D. Awarded with Highest Honor', org: 'Scuola Superiore Sant’Anna' },
  { year: '2017', title: 'Ph.D. Fellowship — top 1% of 100+ candidates', org: 'Scuola Superiore Sant’Anna' },
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
  { year: '2024', title: 'Electrophysiological biomarkers for sensing-enabled DBS in OCD', venue: 'NIH BRAIN Initiative Conference — Scholar Spotlight Plenary', place: 'Bethesda, MD', kind: 'Plenary', highlight: true },
  { year: '2024', title: 'A candidate responsive biomarker in sensing-enabled DBS for OCD', venue: 'Congress of Neurological Surgeons Annual Meeting', place: 'Houston, TX', kind: 'Conference' },
  { year: '2024', title: 'Biomarker-guided DBS for obsessive-compulsive disorder', venue: 'Biennial Psychiatric Neurosurgery Symposium', place: 'Nashville, TN', kind: 'Conference' },
  { year: '2024', title: 'Distinct roles of subthalamic neuron coupling to speech-related cortical areas', venue: 'Joint BWH–MGH Neurosurgery Translational Science Series', place: 'Boston, MA', kind: 'Invited' },
  { year: '2022', title: 'Speech-related spike-phase coupling of subthalamic neurons to the human cortex', venue: 'Human Single Neuron Conference', place: 'UCSF, San Francisco, CA', kind: 'Conference' },
]

// Media / press where the research is featured
export type Media = { label: string; org: string; href: string }
export const media: Media[] = [
  {
    label: 'Behind the paper — “Synchrony in Speech”',
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

export const navLinks = [
  { id: 'about', label: 'About' },
  { id: 'research', label: 'Research' },
  { id: 'work', label: 'Featured' },
  { id: 'publications', label: 'Papers' },
  { id: 'awards', label: 'Awards' },
  { id: 'talks', label: 'Talks' },
  { id: 'contact', label: 'Contact' },
]
