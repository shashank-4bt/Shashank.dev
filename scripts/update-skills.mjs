import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OWNER,
  catalog,
  featuredByRepo,
  repoDisplayNames,
  skillOverrides,
} from '../src/data/skill-config.js';

const exec = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const outFile = join(root, 'src', 'data', 'skill-usage.js');

const MIN_LEVEL = { HIGH: 3, MEDIUM: 2, LOW: 1 };

async function ghJson(path) {
  const { stdout } = await exec('gh', ['api', path], { maxBuffer: 30_000_000 });
  return JSON.parse(stdout);
}

async function ghRaw(repo, path) {
  try {
    const { stdout } = await exec(
      'gh',
      [
        'api',
        '-H',
        'Accept: application/vnd.github.raw',
        `repos/${OWNER}/${repo}/contents/${encodeURI(path)}`,
      ],
      { maxBuffer: 8_000_000 },
    );
    return stdout;
  } catch {
    return '';
  }
}

function isManifest(path) {
  const base = path.split('/').pop() || '';
  return (
    /^(package\.json|pyproject\.toml|requirements.*\.txt|cmakelists\.txt|dockerfile.*|docker-compose.*|compose\.ya?ml|pubspec\.yaml|go\.mod|vercel\.json|render\.yaml|build\.gradle(?:\.kts)?|settings\.gradle(?:\.kts)?|libs\.versions\.toml|schema\.prisma)$/i.test(
      base,
    ) ||
    /\.sql$/i.test(base) ||
    path.includes('.github/workflows/') ||
    /^readme/i.test(base)
  );
}

function count(paths, re) {
  return paths.filter((path) => re.test(path)).length;
}

function langBytes(languages, name) {
  return Number(languages[name] || 0);
}

function add(hits, skill, level, reason) {
  const rank = MIN_LEVEL[level];
  if (!rank) return;
  const current = hits.get(skill);
  if (!current || rank > current.rank) {
    hits.set(skill, { level, rank, reason });
  }
}

function detect(repo) {
  const { name, languages, paths, blob } = repo;
  const hits = new Map();
  const sourceJs = count(paths, /\.(js|jsx|mjs|cjs)$/i);
  const sourceTs = count(paths, /\.(ts|tsx)$/i);
  const kt = count(paths, /\.kt$/i);
  const py = count(paths, /\.py$/i);
  const cpp = count(paths, /\.(cpp|hpp|cc|cxx)$/i);
  const java = count(paths, /\.java$/i);
  const html = count(paths, /\.html?$/i);
  const css = count(paths, /\.css$/i);
  const sql = count(paths, /\.sql$/i);
  const tests = count(
    paths,
    /(^|\/)(tests?|__tests__|spec)\//i,
  ) + count(paths, /\.(test|spec)\.[jt]sx?$/i);

  if (cpp >= 3 || langBytes(languages, 'C++') > 20_000) add(hits, 'C++', 'HIGH', 'C++ sources');
  if (py >= 3 || langBytes(languages, 'Python') > 10_000) add(hits, 'Python', 'HIGH', 'Python sources');
  if (kt >= 8 || langBytes(languages, 'Kotlin') > 50_000) add(hits, 'Kotlin', 'HIGH', 'Kotlin sources');
  if (java >= 3 && kt === 0) add(hits, 'Java', 'HIGH', 'Java sources');
  if (sourceJs >= 4) add(hits, 'JavaScript', 'HIGH', 'JavaScript sources');
  if (sourceTs >= 4) add(hits, 'TypeScript', 'HIGH', 'TypeScript sources');
  if (html >= 1) add(hits, 'HTML', 'HIGH', 'HTML files');
  if (css >= 1) add(hits, 'CSS', 'HIGH', 'CSS files');
  if (sql >= 1) add(hits, 'SQL', 'HIGH', 'SQL schema');

  if (
    count(paths, /\.(jsx|tsx)$/i) >= 2 ||
    /"react"\s*:/.test(blob) ||
    /from ['"]react['"]/.test(blob)
  ) {
    add(hits, 'React', 'HIGH', 'React sources/dependency');
  }
  if (/tailwindcss/.test(blob)) add(hits, 'Tailwind CSS', 'HIGH', 'Tailwind config/dependency');
  if (/vite\.config|@vitejs\/plugin-react|"vite"\s*:/.test(blob)) {
    add(hits, 'Vite', 'HIGH', 'Vite toolchain');
  }
  if (
    /"express"\s*:|"next"\s*:|"fastify"\s*:|"engines"\s*:\s*\{[^}]*"node"/.test(blob) ||
    count(paths, /package\.json$/i) >= 1 && (sourceJs + sourceTs) >= 8
  ) {
    add(hits, 'Node.js', 'HIGH', 'Node package');
  }
  if (/"express"\s*:/.test(blob)) add(hits, 'Express.js', 'HIGH', 'Express dependency');
  if (/fastapi/.test(blob)) add(hits, 'FastAPI', 'HIGH', 'FastAPI dependency');
  if (/\bdjango==|\bdjango>=|djangorestframework/.test(blob)) add(hits, 'Django', 'HIGH', 'Django dependency');

  if (/jsonwebtoken|python-jose|nimbus-jose-jwt|jwtencode|jwttokenservice/.test(blob)) {
    add(hits, 'JWT', 'HIGH', 'JWT library');
  }
  if (
    /jsonwebtoken|python-jose|passlib|bcrypt|firebase_auth|nimbus-jose-jwt|configureauthroutes/.test(
      blob,
    )
  ) {
    add(hits, 'Authentication & Authorization', 'HIGH', 'Auth implementation');
  }
  if (
    /fastapi|express|djangorestframework|ktor\.server|fastify|"axios"\s*:/.test(blob) ||
    count(paths, /routes?\//i) >= 2 ||
    count(paths, /\/api\/.*route\.(ts|js)$/i) >= 2
  ) {
    add(hits, 'REST APIs', 'HIGH', 'HTTP API surface');
  }

  if (
    /"pg"\s*:/.test(blob) ||
    /embedded-postgres/.test(blob) ||
    /org\.postgresql/.test(blob) ||
    /provider\s*=\s*"postgresql"/.test(blob) ||
    /image:\s*postgres/.test(blob) ||
    paths.some(
      (path) =>
        /(^|\/)postgres(\/|\.|$)/i.test(path) || /schema\/postgres/i.test(path),
    )
  ) {
    add(hits, 'PostgreSQL', 'HIGH', 'PostgreSQL usage');
  }
  if (/mongoose|mongodb/.test(blob)) add(hits, 'MongoDB', 'HIGH', 'MongoDB usage');
  if (/mongoose/.test(blob)) add(hits, 'Mongoose', 'HIGH', 'Mongoose ODM');
  if (/sqlite3|sqlite_store|sqlite3_flutter|drift_flutter|sqlite:\/\//.test(blob) || paths.some((path) => /sqlite/i.test(path))) {
    add(hits, 'SQLite', 'HIGH', 'SQLite usage');
  }
  if (/duckdb/.test(blob)) add(hits, 'DuckDB', 'HIGH', 'DuckDB dependency');
  if (/prisma\/schema\.prisma|"prisma"\s*:|@prisma\/client/.test(blob) || paths.some((path) => /prisma/i.test(path))) {
    add(hits, 'Prisma', 'HIGH', 'Prisma schema');
  }
  if (/pyarrow|parquet_store|\.parquet/.test(blob) || paths.some((path) => /parquet/i.test(path))) {
    add(hits, 'Parquet', 'HIGH', 'Parquet storage');
  }

  if (/scikit-learn|from sklearn|import sklearn/.test(blob)) add(hits, 'Scikit-learn', 'HIGH', 'sklearn');
  if (/xgboost|xgbregressor/.test(blob)) add(hits, 'XGBoost', 'HIGH', 'XGBoost');
  if (/catboost/.test(blob)) add(hits, 'CatBoost', 'HIGH', 'CatBoost');
  if (/torch>=|import torch|from torch/.test(blob)) add(hits, 'PyTorch', 'HIGH', 'PyTorch');
  if (/mlflow/.test(blob)) add(hits, 'MLflow', 'HIGH', 'MLflow');
  if (/numpy/.test(blob)) add(hits, 'NumPy', 'HIGH', 'NumPy');
  if (/pandas/.test(blob)) add(hits, 'Pandas', 'HIGH', 'Pandas');
  if (/scipy/.test(blob)) add(hits, 'SciPy', 'HIGH', 'SciPy');
  if (/numba|_numba_kernels/.test(blob)) add(hits, 'Numba', 'HIGH', 'Numba');
  if (/statsmodels/.test(blob)) add(hits, 'Statsmodels', 'HIGH', 'Statsmodels');

  if (name === 'QuantLab') {
    add(hits, 'Quantitative Research', 'HIGH', 'QuantLab research platform');
    add(hits, 'Algorithmic Trading', 'HIGH', 'strategy/execution packages');
    add(hits, 'Event-Driven Systems', 'HIGH', 'event-driven backtest + kafka');
    add(hits, 'Backtesting', 'HIGH', 'backtesting package');
    add(hits, 'Portfolio Construction', 'HIGH', 'portfolio package');
    add(hits, 'Risk Analytics', 'HIGH', 'risk package');
    add(hits, 'Market Data', 'HIGH', 'market data providers');
    add(hits, 'Data Cleaning', 'HIGH', 'data quality pipeline');
    add(hits, 'Data Pipelines', 'HIGH', 'data pipeline tests');
    add(hits, 'API Design', 'HIGH', 'FastAPI research API');
  }

  if (/firecrawl/.test(blob)) {
    add(hits, 'Firecrawl', 'HIGH', 'Firecrawl client');
    add(hits, 'Web/Data Crawling', 'HIGH', 'site scrape pipeline');
    add(hits, 'API Integration', 'HIGH', 'Firecrawl HTTP API');
  }
  if (/yfinance|httpx|aiohttp|requests>=|axios|fetch\(/.test(blob)) {
    add(hits, 'API Integration', 'MEDIUM', 'external HTTP APIs');
  }

  if (paths.some((path) => /dockerfile/i.test(path))) add(hits, 'Docker', 'HIGH', 'Dockerfile');
  if (paths.some((path) => /docker-compose|compose\.ya?ml/i.test(path))) {
    add(hits, 'Docker Compose', 'HIGH', 'Compose file');
  }
  if (paths.some((path) => path.startsWith('.github/workflows/'))) {
    add(hits, 'GitHub Actions', 'HIGH', 'workflow files');
    add(hits, 'CI/CD', 'HIGH', 'CI workflows');
    add(hits, 'GitHub', 'HIGH', 'GitHub Actions');
    add(hits, 'Git', 'MEDIUM', 'CI checkout');
  }
  if (paths.some((path) => /vercel\.json$/i.test(path))) add(hits, 'Vercel', 'HIGH', 'vercel.json');

  if (tests >= 3 || /pytest|googletest|vitest|junit|flutter_test/.test(blob)) {
    add(hits, 'Testing', 'HIGH', 'automated tests');
  }
  if (
    paths.some((path) => /architect/i.test(path)) ||
    /matching engine|system architecture/.test(blob)
  ) {
    add(hits, 'System Architecture', 'MEDIUM', 'architecture docs/layout');
  }
  if (sql >= 1 || /prisma\/schema|schema\.sql|sqlite_store|flyway/.test(blob)) {
    add(hits, 'Database Design', 'HIGH', 'schema files');
  }
  if (/helmet|csrf|ssrf|bcrypt|python-jose|xss|security validation/.test(blob) || paths.some((path) => /ssrf|security/i.test(path))) {
    add(hits, 'Security', 'HIGH', 'security controls');
  }
  if (/zod|"pydantic"|validate\.ts|input validation/.test(blob) || paths.some((path) => /validat/i.test(path))) {
    add(hits, 'Input Validation', 'HIGH', 'validators');
  }
  if (
    /benchmark|numba|performance optimization|googletest/.test(blob) ||
    paths.some((path) => /benchmark|perf/i.test(path))
  ) {
    add(hits, 'Performance Optimization', 'MEDIUM', 'benchmarks/kernels');
  }
  if (/fully responsive ui|tailwindcss|jetpack compose|flutter:/.test(blob)) {
    add(hits, 'Responsive UI/UX', 'MEDIUM', 'UI toolkit');
  }
  if (/fastapi|express|fastify|ktor\.server/.test(blob)) {
    add(hits, 'API Design', 'MEDIUM', 'API framework');
  }

  if (name === 'Essential_Webpgs' && /html, css and javascript/.test(blob)) {
    add(hits, 'HTML', 'MEDIUM', 'README stack');
    add(hits, 'CSS', 'MEDIUM', 'README stack');
    add(hits, 'JavaScript', 'MEDIUM', 'README stack');
  }

  const extras = skillOverrides[name] || skillOverrides[repoDisplayNames[name]] || [];
  for (const skill of extras) add(hits, skill, 'MEDIUM', 'manual override');

  return hits;
}

function projectRecord(repoName) {
  const featured = featuredByRepo[repoName];
  if (featured) {
    return { name: featured.name, type: 'featured', href: featured.href };
  }
  return {
    name: repoDisplayNames[repoName] || repoName,
    type: 'repository',
    href: `https://github.com/${OWNER}/${repoName}`,
  };
}

async function inspectRepo(meta) {
  let languages = {};
  let paths = [];
  try {
    languages = await ghJson(`repos/${OWNER}/${meta.name}/languages`);
  } catch {
    languages = {};
  }
  try {
    const tree = await ghJson(
      `repos/${OWNER}/${meta.name}/git/trees/${encodeURIComponent(meta.default_branch)}?recursive=1`,
    );
    paths = (tree.tree || []).filter((item) => item.type === 'blob').map((item) => item.path);
  } catch {
    paths = [];
  }

  const manifests = [
    ...paths.filter(isManifest),
    ...paths.filter(
      (path) =>
        /(?:^|\/)(connection|auth|firecrawl|sqlite_store)\.[a-z]+$/i.test(path) ||
        /(?:^|\/)(database|db)\/.*\.(py|ts|kt)$/i.test(path),
    ),
  ]
    .filter((path, index, all) => all.indexOf(path) === index)
    .slice(0, 42);
  const chunks = [];
  for (const path of manifests) {
    const text = await ghRaw(meta.name, path);
    if (text) chunks.push(`FILE ${path}\n${text.slice(0, 12_000)}`);
  }

  return {
    name: meta.name,
    private: meta.private,
    fork: meta.fork,
    language: meta.language,
    html_url: meta.html_url,
    languages,
    paths,
    blob: `${paths.join('\n')}\n${chunks.join('\n')}`.toLowerCase(),
  };
}

function serialize(value) {
  return JSON.stringify(value, null, 2);
}

async function main() {
  console.log(`Inspecting GitHub user ${OWNER}…`);
  const repos = await ghJson('user/repos?per_page=100&affiliation=owner');
  const owned = repos.filter((repo) => !repo.archived);
  const inspected = [];

  for (const meta of owned) {
    process.stdout.write(`  ${meta.name}${meta.private ? ' (private)' : ''}… `);
    const repo = await inspectRepo(meta);
    inspected.push(repo);
    console.log(`${repo.paths.length} files`);
  }

  const usage = Object.fromEntries(catalog.map((skill) => [skill, []]));
  const seen = Object.fromEntries(catalog.map((skill) => [skill, new Set()]));

  for (const repo of inspected) {
    if (repo.paths.length <= 1 && repo.name === 'UTILO') continue;
    const hits = detect(repo);
    const project = projectRecord(repo.name);
    for (const [skill, evidence] of hits) {
      if (evidence.rank < MIN_LEVEL.MEDIUM) continue;
      if (!usage[skill]) continue;
      if (seen[skill].has(project.name)) continue;
      seen[skill].add(project.name);
      usage[skill].push(project);
    }
  }

  for (const skill of catalog) {
    usage[skill].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'featured' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  const unverified = catalog.filter((skill) => usage[skill].length === 0);
  const generatedAt = new Date().toISOString();
  const inspectedRepos = inspected.map((repo) => ({
    name: repo.name,
    private: repo.private,
    fork: repo.fork,
    language: repo.language,
    files: repo.paths.length,
    url: repo.html_url,
  }));

  const file = `/** Generated by scripts/update-skills.mjs — edit skill-config.js, then re-run. */
export const generatedAt = ${serialize(generatedAt)};

export const inspectedRepos = ${serialize(inspectedRepos)};

export const unverifiedSkills = ${serialize(unverified)};

export const skillUsage = ${serialize(usage)};
`;

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, file);
  console.log(`Wrote ${outFile}`);
  console.log(`Unverified skills: ${unverified.join(', ') || 'none'}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
