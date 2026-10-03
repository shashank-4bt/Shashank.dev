/** Profile + public non-featured repos from the last GitHub inspect. */

import { featuredByRepo, OWNER } from './skill-config.js';
import { generatedAt, inspectedRepos } from './skill-usage.js';

export const githubProfile = {
  login: OWNER,
  name: 'Shashank Kumar Singh',
  url: `https://github.com/${OWNER}`,
  fetchedAt: generatedAt,
};

const otherOrder = [
  'Trash-Track',
  'Skillyn',
  'PaceFlow',
  'scenecast',
  'Android_Development',
  'NetPulse',
  'Shashank.dev',
];

export const otherWork = inspectedRepos
  .filter((repo) => !repo.private && !featuredByRepo[repo.name])
  .map((repo) => ({
    name: repo.name,
    url: repo.url,
  }))
  .sort((a, b) => {
    const ia = otherOrder.indexOf(a.name);
    const ib = otherOrder.indexOf(b.name);
    if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
