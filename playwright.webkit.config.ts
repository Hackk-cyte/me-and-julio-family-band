import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./tests',timeout:120000,expect:{timeout:15000},workers:1,retries:0,
  reporter:[['list'],['html',{open:'never',outputFolder:process.env.PLAYWRIGHT_HTML_OUTPUT_DIR||'playwright-webkit-report'}]],
  outputDir:process.env.WEBKIT_TEST_OUTPUT||'test-results-webkit',
  use:{baseURL:process.env.BASE_URL||'http://127.0.0.1:5173/',headless:true,actionTimeout:15000,trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects:[{name:'iphone13-webkit',use:{...devices['iPhone 13'],browserName:'webkit'}},{name:'small-iphone-webkit',use:{...devices['iPhone SE'],browserName:'webkit'}}],
  webServer:process.env.BASE_URL?undefined:{command:'npm run dev -- --port 5173 --strictPort',url:'http://127.0.0.1:5173/',reuseExistingServer:!process.env.CI,timeout:60000},
});
