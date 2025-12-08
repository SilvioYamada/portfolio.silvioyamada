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
    'https://portfolio.silvioyamada.github.io',
    'https://your-parent-site.com',
  ];

  window.__allowHashNavigationFromParent = true;

  function isAllowedOrigin(origin) {
    if (allowedParentOrigins.includes('*')) return true;
    return allowedParentOrigins.includes(origin);
  }

  window.addEventListener('message', (e) => {
    if (!isAllowedOrigin(e.origin)) return;
    if (!e.data || typeof e.data.type !== 'string') return;

    switch (e.data.type) {
      case 'forceDefaultActive':
        window.__allowHashNavigationFromParent = false;
        // Mark the DOM so scroll spy can detect the parent control even across reloads
        try { document.documentElement.dataset.iframeControlled = 'true'; } catch (err) {}
        // Try to set active to hero/home — adjust selector according to your site
        try {
          const defaultLink = document.querySelector('nav ul li a[href="#hero"]') || document.querySelector('nav ul li a[href="#home"]');
          if (defaultLink) {
            document.querySelectorAll('nav ul li a').forEach(a => a.classList.remove('active'));
            defaultLink.classList.add('active');
          }
          history.replaceState({page: 'hero'}, '', '#hero');
        } catch (err) { console.warn('forceDefaultActive error', err); }
        // reply back to parent to confirm we set the default active
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
