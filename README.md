# Landing-Page---Silvio-Yamada

Landing page project

## Menu active behavior fix

This branch adds a 'freezeActive' mechanism to improve menu behavior when the site is embedded in a parent (e.g., iframe) and the parent expands the content (fullscreen). The script prevents scrollspy or automatic menu changes while the parent indicates the site is expanded.

- Added `freezeAuto` flag (controlled via `postMessage` from parent).
- Modified nav scrollspy to respect `freezeAuto` and only update active state when the change originates from user clicks.
- Added Playwright E2E tests to validate behavior.

### How to run tests locally

Start a local http server (root of repo) and run tests:

```bash
python3 -m http.server 8080
npm install
npx playwright install
npm test
```

If you want me to open a PR that merges these changes into `main`, confirm and I will create it and include a concise description and notes about merging to production. You can also request changes to the test coverage or behavior.
