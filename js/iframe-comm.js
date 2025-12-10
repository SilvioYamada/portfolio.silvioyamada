(function(){
  /*
    Snippet to support being embedded in iframes.
    Parent (embedding page) can post messages to the child to control
    hash-based navigation / scroll spy. Child will validate origin.

    To use: add this file before your main script in index.html:
      <script defer src="js/iframe-comm.js"></script>
      <script defer src="js/main.js"></script>

    CONFIGURE allowedParentOrigins for production!
  */
  'use strict';

  // Allowed parent origins that can send messages. Update for production.
  const allowedParentOrigins = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://portfolio.silvioyamada.github.io',
    'https://your-parent-site.com',
  ];

  window.__allowHashNavigationFromParent = true;

  function isAllowedOrigin(origin) {
    if (allowedParentOrigins.includes('*')) return true;
    if (allowedParentOrigins.includes(origin)) return true;
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
    } catch (e) {}
    return false;
  }

  window.addEventListener('message', (e) => {
    if (!isAllowedOrigin(e.origin)) return;
    if (!e.data || typeof e.data.type !== 'string') return;

    switch (e.data.type) {
      case 'forceDefaultActive':
        window.__allowHashNavigationFromParent = false;
        try { document.documentElement.dataset.iframeControlled = 'true'; } catch (err) {}
        try {
          // ensure the child is scrolled to the top (hero visible) before setting active
          try { window.scrollTo(0, 0); if (document.scrollingElement) document.scrollingElement.scrollTop = 0; } catch (e) {}
          // temporarily remove smooth scroll for deterministic effect
          const prev = document.documentElement.style.scrollBehavior;
          try { document.documentElement.style.scrollBehavior = 'auto'; } catch (e) {}

          const defaultLink = document.querySelector('nav ul li a[href="#hero"]') || document.querySelector('nav ul li a[href="#home"]');
          if (defaultLink) {
            document.querySelectorAll('nav ul li a').forEach(a => a.classList.remove('active'));
            defaultLink.classList.add('active');
          }
          history.replaceState({page: 'hero'}, '', '#hero');

          setTimeout(() => { try { document.documentElement.style.scrollBehavior = prev || ''; } catch (err) {} }, 200);

        } catch (err) { console.warn('forceDefaultActive error', err); }
        try { window.parent.postMessage({ type: 'ack_forceDefaultActive' }, e.origin); } catch (err) {}
        break;
      case 'allowHashNavigation':
        window.__allowHashNavigationFromParent = true;
        try { delete document.documentElement.dataset.iframeControlled; } catch (err) {}
        try { window.parent.postMessage({ type: 'ack_allowHashNavigation' }, e.origin); } catch (err) {}
        break;
      case 'parentLoaded':
        // optional — parent tell the child it's loaded
        break;
      default:
        // ignore unknown messages
        break;
    }
  }, false);

  // Notify parent that child is ready
  window.addEventListener('DOMContentLoaded', () => {
    try { window.parent.postMessage({type: 'childReady'}, '*'); } catch(e) {}
  });
})();
