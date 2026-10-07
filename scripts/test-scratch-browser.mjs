import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const source = await fs.readFile(new URL('../src/test/browser/LifecycleProbe.java', import.meta.url), 'utf8');
const checks = await fs.readFile(new URL('../src/test/browser/PortableBehaviorChecks.java', import.meta.url), 'utf8');
const expected = await fs.readFile(new URL('../src/test/browser/lifecycle-expected.txt', import.meta.url), 'utf8');
const server = await createServer({ configFile: false, server: { host: '127.0.0.1', port: 0 },
    define: { APP_VERSION: JSON.stringify('test'), BUILD_DATE: JSON.stringify('test') } });
let browser;
try {
    await server.listen();
    const port = server.httpServer.address().port;
    browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
    for (const flavor of ['standard', 'nrw']) {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:${port}/src/test/browser/scratch.html`);
        await page.waitForFunction(() => !!window.scratchTest);
        await page.evaluate(({ source, flavor }) => window.scratchTest.start(source, flavor), { source, flavor });
        await page.waitForFunction(() => {
            const value = window.scratchTest.snapshot();
            if (value.error) throw new Error(`${value.exception}\n${value.output}`);
            return value.output?.endsWith('ready\n') && value.monitors.length === 6
                && value.monitors.every(monitor => monitor.text !== '');
        }, undefined, { timeout: 15000 });
        const before = await page.evaluate(() => window.scratchTest.snapshot());
        assert.equal(before.output, expected);
        assert.equal(before.renderer, 1, 'must render with WebGL');
        assert.deepEqual(before.missingAssets, [], 'all release atlas frames must load at their catalog dimensions');
        assert.equal(before.steps, 0, 'constructor pause prevents game frames');
        assert.deepEqual(before.monitors.map(monitor => [monitor.label, monitor.text]),
            [['frames', '0'], ['decimal', '1.23'], ['array', '[2]'], ['broken', '?'], ['timer', 'false'], ['ProbeSprite: score', '7']]);
        await page.evaluate(() => window.scratchTest.step());
        await page.waitForFunction(() => window.scratchTest.snapshot().steps === 1);
        await page.waitForFunction(() => window.scratchTest.snapshot().monitors[0].text === '1');
        const stepped = await page.evaluate(() => window.scratchTest.snapshot());
        assert.ok(Math.abs(stepped.millis - 1000 / 60) < 0.001);
        assert.equal(stepped.sprites[0].speech, true);
        // Waiting uses browser animation frames; game time must remain paused.
        await page.evaluate(() => new Promise(resolve => {
            let frames = 0;
            const tick = () => ++frames === 12 ? resolve() : requestAnimationFrame(tick);
            requestAnimationFrame(tick);
        }));
        const paused = await page.evaluate(() => window.scratchTest.snapshot());
        assert.equal(paused.steps, 1);
        assert.equal(paused.sprites[0].x, stepped.sprites[0].x);
        assert.equal(paused.sprites[0].speech, true);
        for (let index = 2; index <= 7; index++) {
            await page.evaluate(() => window.scratchTest.step());
            await page.waitForFunction(index => window.scratchTest.snapshot().steps === index, index);
        }
        const finished = await page.evaluate(() => window.scratchTest.snapshot());
        await page.waitForFunction(() => window.scratchTest.snapshot().monitors.find(m => m.label === 'timer').text === 'true');
        assert.equal(finished.sprites[0].speech, false);
        assert.equal(finished.sprites[0].x, 92, 'glide completes at step six, followed by two runs');
        assert.deepEqual(errors, []);
        const artifacts = process.env.SCRATCH_BROWSER_ARTIFACTS || path.join(os.tmpdir(), 'scratch-browser-tests');
        await fs.mkdir(artifacts, { recursive: true });
        await page.screenshot({ path: path.join(artifacts, `${flavor}.png`) });
        await page.evaluate(() => window.scratchTest.stop());
        await page.close();
        const checkPage = await browser.newPage();
        await checkPage.goto(`http://127.0.0.1:${port}/src/test/browser/scratch.html`);
        await checkPage.waitForFunction(() => !!window.scratchTest);
        const checkSource = checks + '\nvoid main(){ new Stage(); PortableBehaviorChecks.run(); println("BEHAVIOR_PASS"); Window.getInstance().pause(); }\n';
        await checkPage.evaluate(({ source, flavor }) => window.scratchTest.start(source, flavor), { source: checkSource, flavor });
        await checkPage.waitForFunction(() => {
            const value = window.scratchTest.snapshot();
            if (value.error) throw new Error(`${value.exception}\n${value.output}`);
            return value.output?.includes('BEHAVIOR_PASS');
        }, undefined, { timeout: 15000 });
        await checkPage.evaluate(() => window.scratchTest.stop());
        await checkPage.close();
        console.log(`Portable movement, collision, score, clone and random checks: ${flavor} passed`);
        console.log(`Scratch WebGL lifecycle, monitors and stepping: ${flavor} passed`);
    }
} finally {
    await browser?.close();
    await server.close();
}
