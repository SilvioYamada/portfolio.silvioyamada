/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
  },
  timeout: 30_000,
};
module.exports = config;
