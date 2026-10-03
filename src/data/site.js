/** Single source for identity, Now, map, process, and timeline. */

export const site = {
  name: 'Shashank Kumar Singh',
  wordmark: 'SHASHANK.DEV',
  url: 'https://shashank.dev',
  githubRepo: 'https://github.com/shashank-4bt/Shashank.dev',
  github: 'https://github.com/shashank-4bt',
  githubLabel: 'github.com/shashank-4bt',
  linkedin: 'https://www.linkedin.com/in/shashank-kumar-singh-a8aa9930a/',
  email: 'singhshashankcse@gmail.com',
  phone: '+91 7897947999',
  phoneHref: 'tel:+917897947999',
  roles: ['Software Engineer', 'Quantitative Developer', 'Builder'],
  title: 'Shashank Kumar Singh — Software Engineer · Quantitative Developer',
  description:
    'Software engineer and quantitative developer building software systems, research platforms, products, and technical experiments.',
  location: 'India',
};

export const now = [
  { label: 'Building', value: 'Knowlyy', href: '#project-knowlyy' },
  {
    label: 'Researching',
    value: 'Quantitative systems & algorithmic trading',
    href: '#project-quantlab',
  },
  { label: 'Exploring', value: 'Systems · ML · Data Engineering' },
  { label: 'Focus', value: 'Software Engineering · Quant · Backend' },
];

export const process = [
  { n: '01', title: 'Understand', text: 'Break the problem into constraints.' },
  { n: '02', title: 'Model', text: 'Design the system before the interface.' },
  { n: '03', title: 'Build', text: 'Implement the smallest useful architecture.' },
  { n: '04', title: 'Measure', text: 'Test behaviour and performance.' },
  { n: '05', title: 'Refine', text: 'Remove unnecessary complexity.' },
  { n: '06', title: 'Ship', text: 'Deploy something people can actually use.' },
];

export const timeline = {
  year: '2026',
  items: [
    { name: 'QuantLab', field: 'Quantitative Research', href: '#project-quantlab' },
    { name: 'Mercury', field: 'Systems / C++', href: '#project-mercury' },
    { name: 'PhishEye', field: 'Security / ML', href: '#project-phisheye' },
    { name: 'FundMatch', field: 'Product / AI', href: '#project-fundmatch' },
    {
      name: 'Knowlyy',
      field: 'Social / Kotlin',
      href: '#project-knowlyy',
      current: true,
      note: 'Currently building',
    },
  ],
};

export const contactDomains = ['Software', 'Systems', 'Quantitative Research', 'Products'];

export const systemMap = {
  root: {
    id: 'root',
    label: 'Shashank',
    blurb: 'Work across systems, data, product, and research — connected by the same engineering habit.',
    related: ['Mercury', 'QuantLab', 'Knowlyy', 'PhishEye', 'FundMatch'],
  },
  nodes: [
    {
      id: 'systems',
      label: 'Systems',
      stack: 'C++ / APIs',
      project: { name: 'Mercury', href: '#project-mercury' },
      related: ['C++20', 'CMake', 'GoogleTest', 'Order book', 'Price-time priority'],
    },
    {
      id: 'data',
      label: 'Data',
      stack: 'Python / ML',
      project: { name: 'QuantLab', href: '#project-quantlab' },
      related: ['Python', 'FastAPI', 'DuckDB', 'Parquet', 'MLflow', 'PhishEye'],
    },
    {
      id: 'product',
      label: 'Product',
      stack: 'React / TS / Kotlin',
      project: { name: 'Knowlyy', href: '#project-knowlyy' },
      related: ['Kotlin', 'React', 'TypeScript', 'FundMatch', 'Authentication'],
    },
    {
      id: 'research',
      label: 'Research',
      stack: 'Trading / Risk',
      project: { name: 'QuantLab', href: '#project-quantlab' },
      related: ['Backtesting', 'Portfolio construction', 'Risk analytics', 'Market data'],
    },
  ],
};

/** Featured-project links only. Built from skill-usage.js evidence, not inference. */
export const graphLinks = [
  { tech: 'C++', projects: ['mercury'] },
  { tech: 'Python', projects: ['quantlab', 'phisheye', 'fundmatch'] },
  { tech: 'Kotlin', projects: ['knowlyy'] },
  { tech: 'TypeScript', projects: ['fundmatch'] },
  { tech: 'React', projects: ['phisheye', 'fundmatch'] },
  { tech: 'FastAPI', projects: ['quantlab', 'phisheye'] },
];

export const techMatrix = {
  projects: ['QuantLab', 'Mercury', 'Knowlyy', 'PhishEye', 'FundMatch'],
  rows: [
    { skill: 'Python', marks: [true, false, false, true, true] },
    { skill: 'C++', marks: [false, true, false, false, false] },
    { skill: 'Kotlin', marks: [false, false, true, false, false] },
    { skill: 'TypeScript', marks: [false, false, false, false, true] },
    { skill: 'React', marks: [false, false, false, true, true] },
    { skill: 'FastAPI', marks: [true, false, false, true, false] },
    { skill: 'Scikit-learn', marks: [true, false, false, false, false] },
    { skill: 'DuckDB', marks: [true, false, false, false, false] },
  ],
};
