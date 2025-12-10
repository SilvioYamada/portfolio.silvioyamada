# Iframe Embedding and iframe-comm.js

This document describes how to safely embed this site in an iframe and how to configure the `js/iframe-comm.js` snippet to coordinate the parent and child behavior—especially to prevent the nav active state from jumping when transitioning the iframe to fullscreen.

## Summary
- The `js/iframe-comm.js` snippet listens for postMessage events from embedding parents and toggles the child's behavior:
  - `forceDefaultActive` disables the scroll-spy and forces the `#hero` link to be active (useful during a parent expansion animation).
  - `allowHashNavigation` re-enables the scroll-spy behavior.
- `js/main.js` now dynamically loads `js/iframe-comm.js` and respects the `window.__allowHashNavigationFromParent` flag.
- We added `js/iframe-comm.js` to `index.html` so the listener is available early, but the dynamic loader ensures compatibility if you forget to include it.

## Configuration
1. Add your parent domain(s) to `allowedParentOrigins` inside `js/iframe-comm.js` to limit who can post messages (recommended). For example:

```js
const allowedParentOrigins = [
  'https://your-embedding-site.com',
  'http://localhost:8080',
];
```

2. If you host the embedding parent on a platform that uses a different origin (e.g. Netlify, GitHub Pages), add that origin as well.

3. If you use a Content Security Policy or Netlify `_headers`, ensure your site allows being embedded (or set an appropriate `frame-ancestors` rule if you are embedding the child into another of your own pages).

## Parent usage example (embedding page)
Use `postMessage` to tell the child to put the default nav active before your fullscreen transition, and allow hash navigation afterward:

```js
const iframe = document.querySelector('#yourIframeId');
const origin = 'https://silvioyamada.com';
iframe.contentWindow.postMessage({ type: 'forceDefaultActive' }, origin);
// ... do animation
iframe.contentWindow.postMessage({ type: 'allowHashNavigation' }, origin);
```

## Testing
- Local dev: add `http://localhost:8080` to `allowedParentOrigins` and run a local server to host the embedding page. This is already included in the snippet for convenience.
- Production: add your actual parent origin(s) and remove `http://localhost:8080`.

## Security notes
- Never use `*` as an origin in production. Only include the exact parent domains that will embed your site.
- Validate messages properly (we already check `event.origin` and the `type` field).

## FAQ
- Why does the menu revert to "Sobre"? — This is typically caused by the scroll-spy detecting a section (e.g., "Sobre") becoming visible during the transition. The parent can prevent that by sending `forceDefaultActive` during the animation.
- Do I need to add `iframe-comm.js` to each page? — If your site uses `js/main.js`, it's enough that `main.js` dynamically loads `iframe-comm.js`. However, we included the explicit script tag in `index.html` for clarity and to make sure the message listener is available before `main.js` runs.

If you want, I can also open a PR to remove `http://localhost:8080` from `allowedParentOrigins` and set specific production origins once you tell me the exact parent embedding domain(s).