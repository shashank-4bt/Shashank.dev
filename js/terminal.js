import { githubProfile } from '../src/data/github-profile.js';

const LINES = {
  whoami: 'Shashank Kumar Singh',
  'ls projects': 'QuantLab\nMercury\nKnowlyy\nPhishEye\nFundMatch',
  ls: 'QuantLab\nMercury\nKnowlyy\nPhishEye\nFundMatch',
  'cat focus.txt': 'systems / quant / data / products',
  help: 'projects\nskills\nabout\ncontact\ngithub\nwhoami\nls projects\ncat focus.txt',
  projects: '→ #work',
  skills: '→ #skills',
  about: '→ #about',
  contact: '→ #contact',
  github: githubProfile.url,
};

const JUMP = {
  projects: '#work',
  skills: '#skills',
  about: '#about',
  contact: '#contact',
};

function coffee() {
  return `ACCESS GRANTED\nCaffeine level:\n██████████████████░ 94%\nProceed with engineering?\n[Y/N]`;
}

export function initTerminal() {
  const form = document.querySelector('[data-term-form]');
  const input = document.querySelector('[data-term-input]');
  const out = document.querySelector('[data-term-out]');
  if (!form || !input || !out) return;

  function write(command, body) {
    const block = document.createElement('div');
    block.className = 'term__block';
    block.innerHTML = `<p class="term__cmd">shashank@dev:~$ ${command}</p><pre>${body}</pre>`;
    out.appendChild(block);
    out.scrollTop = out.scrollHeight;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const command = input.value.trim();
    input.value = '';
    if (!command) return;
    const key = command.toLowerCase();
    if (key === 'sudo coffee') {
      write(command, coffee());
      return;
    }
    if (key === 'clear') {
      out.innerHTML = '';
      return;
    }
    if (JUMP[key]) {
      write(command, LINES[key]);
      document.querySelector(JUMP[key])?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (LINES[key]) {
      write(command, LINES[key]);
      return;
    }
    write(command, `command not found: ${command}`);
  });
}
