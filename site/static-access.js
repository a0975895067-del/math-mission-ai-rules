(() => {
  'use strict';

  const localRewards = {
    qualified: 0,
    stars: 0,
    unlockedIds: [],
    nextUnlock: 3,
  };

  window.MATH_STATIC_EDITION = true;
  window.MATH_GITHUB_DEMO = true;
  window.MathStudentAuth = Object.freeze({
    get currentKey() { return 'local-learner'; },
    get currentEmail() { return ''; },
    get role() { return 'guest'; },
    get studentProfile() { return null; },
    get isVerified() { return true; },
  });

  window.MathSecureApi = Object.freeze({
    csrfToken: 'local-only',
    async refreshCsrf() { return 'local-only'; },
    async api(path) {
      if (path.startsWith('/api/questions/seeds')) return { seeds: [] };
      if (path === '/api/play/progress') return { ...localRewards };
      if (path === '/api/reports/stage1') return { id: `local-${Date.now()}` };
      if (/^\/api\/reports\/[^/]+\/stage2$/.test(path)) {
        return { completed: true, rewards: { ...localRewards } };
      }
      if (path === '/api/reports') return { saved: false, localOnly: true };
      throw new Error('此靜態版不會連線到原站後端。');
    },
  });

  function activate() {
    document.body.dataset.role = 'guest';
    document.querySelectorAll('.learning-area').forEach((section) => {
      section.classList.remove('hidden');
    });
    window.dispatchEvent(new CustomEvent('math-auth-changed', {
      detail: { email: '', key: 'local-learner', role: 'guest' },
    }));
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', activate, { once: true })
    : activate();
})();
