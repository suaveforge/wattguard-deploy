const { chromium } = require(process.cwd() + '/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const rawBase = process.argv[2] || process.env.WATTGUARD_BASE_URL || 'http://127.0.0.1:4173/';
const BASE = rawBase.endsWith('/') ? rawBase : rawBase + '/';
const OUT = path.resolve(process.env.CAPTURE_OUT || 'artifacts');
fs.mkdirSync(path.join(OUT, 'screens'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'video'), { recursive: true });
const log = { base: BASE, startedAt: new Date().toISOString(), checks: [], timeline: [], errors: [] };
const check = (v, n, d = '') => {
  log.checks.push({ name: n, ok: !!v, detail: d });
  if (!v) throw new Error(`${n}: ${d}`);
  console.log('PASS', n, d);
};
const save = () => fs.writeFileSync(path.join(OUT, 'live-qa.json'), JSON.stringify(log, null, 2));

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 450, height: 800 },
      deviceScaleFactor: 1,
      recordVideo: { dir: path.join(OUT, 'video'), size: { width: 450, height: 800 } },
    });
    const page = await context.newPage();
    const video = page.video();
    await page.goto(BASE + '?capture=1#/demo-capture', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#capture-start', { timeout: 15000 });

    check(await page.locator('.capture-ready-icon').count() === 1, 'capture-ready');
    check(await page.locator('img[src*="state-normal.svg"]').count() >= 1, 'identity-icon-loaded');

    const timelineTimer = setInterval(async () => {
      try {
        const item = await page.evaluate(() => ({
          t: Date.now(),
          scene: document.querySelector('#app')?.dataset?.captureScene || '',
          caption: document.querySelector('#app')?.dataset?.captureCaption || '',
          captureState: document.querySelector('#app')?.dataset?.captureState || '',
          level: document.querySelector('.status-row h1')?.textContent?.trim() || '',
          path: location.hash,
        }));
        log.timeline.push(item);
      } catch (e) {
        log.errors.push(String(e));
      }
    }, 250);

    await page.locator('#capture-start').click();
    let shot = 1;
    let lastScene = '';
    const shotTimer = setInterval(async () => {
      try {
        const scene = await page.evaluate(() => document.querySelector('#app')?.dataset?.captureScene || '');
        if (scene && scene !== lastScene) {
          await page.screenshot({ path: path.join(OUT, 'screens', `${String(shot++).padStart(2, '0')}-${scene}.png`) });
          lastScene = scene;
        }
      } catch {}
    }, 300);

    await page.waitForFunction(() => window.__WATTGUARD_CAPTURE_DONE__ === true, null, { timeout: 90000 });
    await page.waitForTimeout(600);
    clearInterval(shotTimer);
    clearInterval(timelineTimer);

    const scenes = [...new Set(log.timeline.map(x => x.scene).filter(Boolean))];
    const required = [
      'intro-normal', 'intro-drift', 'intro-attention', 'learning-baseline', 'home-normal',
      'anomaly-start', 'anomaly-watch', 'anomaly-attention', 'detail-top', 'detail-evidence',
      'evidence-registry', 'home-recovered', 'outro-attention', 'outro-drift', 'outro-recovered'
    ];
    required.forEach(scene => check(scenes.includes(scene), `scene-${scene}`));
    check(log.timeline.some(x => x.level === '주의'), 'watch-state-visible');
    check(log.timeline.some(x => x.level === '확인 필요'), 'attention-state-visible');
    check(log.timeline.some(x => x.scene === 'home-recovered' && x.level === '평상'), 'recovered-state-visible');

    await context.close();
    fs.copyFileSync(await video.path(), path.join(OUT, 'wattguard-live-tour.webm'));
    log.scenes = scenes;
    log.finishedAt = new Date().toISOString();
    save();
  } finally {
    await browser.close();
  }
})().catch(err => {
  log.errors.push(String(err.stack || err));
  save();
  console.error(err);
  process.exit(1);
});
