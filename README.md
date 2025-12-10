# Landing-Page---Silvio-Yamada

Landing page project

## Menu active behavior fix (updated)

This branch previously explored a 'freezeActive' mechanism, but that feature was removed. The remaining changes in this branch are focused on improving the nav active-state behavior and adding tests.

- Keep manual navigation active state persistence via `sessionStorage` for internal anchor links.
- Improve Nav scrollspy to respect manual (clicked) navigation briefly while the user scrolls.
- Added Playwright E2E tests to validate the behavior.

### How to run tests locally

Start a local http server (root of repo) and run tests:

```bash
python3 -m http.server 8080
npm install
npx playwright install
npm test
```

If you want me to open a PR that merges these changes into `main`, confirm and I will create it and include a concise description and notes about merging to production. You can also request changes to the test coverage or behavior.
