import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const source = await fs.readFile(new URL('../src/test/browser/TransitionProbe.java', import.meta.url), 'utf8');
const lifetimeSource = await fs.readFile(new URL('../src/test/browser/StageLifetimeProbe.java', import.meta.url), 'utf8');
const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scratch-transitions-vite-'));
const server = await createServer({ configFile: false, cacheDir,
    server: { host: '127.0.0.1', port: 0, hmr: false },
    define: { APP_VERSION: JSON.stringify('test'), BUILD_DATE: JSON.stringify('test') } });
let browser;
try {
    await server.listen();
    browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
    for (const flavor of ['standard', 'nrw']) {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/src/test/browser/scratch.html`);
        await page.waitForFunction(() => !!window.scratchTest);
        await page.evaluate(({ source, flavor }) => window.scratchTest.start(source, flavor), { source, flavor });
        await page.waitForFunction(() => {
            const value = window.scratchTest.snapshot();
            if (value.error) throw new Error(`${value.exception}\n${value.output}`);
            return value.output.includes('BUILDING');
        });
        const building = await page.evaluate(async () => {
            const stages = await import('/src/compiler/java/runtime/graphics/scratch/ScratchStages.ts');
            const stage = stages.activeScratchStage();
            return { transitioning: stages.scratchStageTransitioning(), running: stages.scratchStagesRunning(),
                alpha: stage.world.app.stage.children.at(-1).alpha };
        });
        assert.deepEqual(building, { transitioning: true, running: false, alpha: 1 });
        await page.waitForFunction(() => {
            const value = window.scratchTest.snapshot();
            if (value.error) throw new Error(`${value.exception}\n${value.output}`);
            return value.output.includes('TRANSITION_PASS');
        });
        assert.equal((await page.evaluate(() => window.scratchTest.snapshot())).output,
            'REQUESTED\nBUILDING\nCREATED\nTRANSITION_PASS\n');
        assert.deepEqual(errors, []);
        await page.evaluate(() => window.scratchTest.stop());
        await page.close();
        console.log(`Lazy stage transitions, asynchronous construction and busy requests: ${flavor} passed`);

        for (const body of ['throw new RuntimeException("FACTORY_FAILURE");', 'return null;']) {
            const failurePage = await browser.newPage();
            await failurePage.goto(`http://127.0.0.1:${server.httpServer.address().port}/src/test/browser/scratch.html`);
            await failurePage.waitForFunction(() => !!window.scratchTest);
            const failureSource = `void main() { Window w = new Window(320, 200); w.setStage(new Stage());
                w.transitionToStage(() -> { ${body} }, 1); }`;
            await failurePage.evaluate(({ source, flavor }) => window.scratchTest.start(source, flavor),
                { source: failureSource, flavor });
            await failurePage.waitForFunction(() => window.scratchTest.snapshot().error);
            const failure = await failurePage.evaluate(async () => {
                const stages = await import('/src/compiler/java/runtime/graphics/scratch/ScratchStages.ts');
                return { transitioning: stages.scratchStageTransitioning(),
                    message: window.scratchTest.snapshot().exception };
            });
            assert.equal(failure.transitioning, false);
            assert.match(failure.message, body.startsWith('throw') ? /FACTORY_FAILURE/ : /Stage supplier returned null/);
            await failurePage.evaluate(() => window.scratchTest.stop());
            await failurePage.close();
        }
        const stoppedPage = await browser.newPage();
        await stoppedPage.goto(`http://127.0.0.1:${server.httpServer.address().port}/src/test/browser/scratch.html`);
        await stoppedPage.waitForFunction(() => !!window.scratchTest);
        await stoppedPage.evaluate(({ source, flavor }) => window.scratchTest.start(source, flavor), { source, flavor });
        await stoppedPage.waitForFunction(() => window.scratchTest.snapshot().output.includes('BUILDING'));
        await stoppedPage.evaluate(() => window.scratchTest.stop());
        assert.equal(await stoppedPage.evaluate(async () =>
            (await import('/src/compiler/java/runtime/graphics/scratch/ScratchStages.ts')).scratchStageTransitioning()), false);
        await stoppedPage.close();
        console.log(`Failed suppliers and stopping during construction release the transition: ${flavor} passed`);

        const lifetimePage = await browser.newPage();
        await lifetimePage.goto(`http://127.0.0.1:${server.httpServer.address().port}/src/test/browser/scratch.html`);
        await lifetimePage.waitForFunction(() => !!window.scratchTest);
        await lifetimePage.evaluate(({ source, flavor }) => window.scratchTest.start(source, flavor),
            { source: lifetimeSource, flavor });
        await lifetimePage.waitForFunction(() => window.scratchTest.snapshot().output.includes('LIFETIME_READY'));
        const visits = await lifetimePage.evaluate(async () => {
            const stages = await import('/src/compiler/java/runtime/graphics/scratch/ScratchStages.ts');
            const stage = stages.activeScratchStage();
            window.savedStage = stage.$f_saved;
            window.discarded = [stage, stage.sprites[0], [...stage.pens][0], [...stage.texts][0]].map(value => new WeakRef(value));
            stages.setActiveScratchStage(window.savedStage);
            const { ScratchPenClass } = await import('/src/compiler/java/runtime/graphics/scratch/ScratchPenClass.ts');
            const pen = new ScratchPenClass();
            pen.attachToWorld(window.savedStage.world);
            pen._setColorRGB(0, 0, 0); pen._setSize(6); pen._setPosition(-100, 0);
            pen._down(); pen._setPosition(-80, 0); pen._up();
            window.orphanPen = new WeakRef(pen);
            return window.savedStage.$f_visits;
        });
        // Let the old interpreted frame leave the scheduler before collecting.
        await lifetimePage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const session = await lifetimePage.context().newCDPSession(lifetimePage);
        await session.send('HeapProfiler.collectGarbage');
        assert.deepEqual(await lifetimePage.evaluate(() => window.discarded.map(reference => !reference.deref())),
            [true, true, true, true], `${flavor}: global dispatch releases the old stage, sprites, pens and texts`);
        assert.equal(await lifetimePage.evaluate(() => !window.orphanPen.deref()), true);
        assert.deepEqual(await lifetimePage.evaluate(() => window.scratchTest.pixels([[-90, 0]])), [[0, 0, 0]]);
        await lifetimePage.evaluate(() => window.savedStage._eraseAll());
        assert.deepEqual(await lifetimePage.evaluate(() => window.scratchTest.pixels([[-90, 0]])), [[255, 255, 255]]);
        await lifetimePage.evaluate(() => window.scratchTest.step());
        await lifetimePage.waitForFunction(visits => window.savedStage.$f_visits === visits + 1, visits);
        await lifetimePage.evaluate(() => window.savedStage.runtime.onKeyPressed('a'));
        await lifetimePage.waitForFunction(() => window.savedStage.$f_presses === 1);
        assert.equal(await lifetimePage.evaluate(() =>
            window.savedStage.scratchLayers.root.parent === window.savedStage.world.app.stage), true);
        assert.equal((await lifetimePage.evaluate(() => window.scratchTest.snapshot())).error, false);
        await session.detach();
        await lifetimePage.evaluate(() => window.scratchTest.stop());
        await lifetimePage.close();
        console.log(`Discarded rooms are collected; retained stages still run and receive input: ${flavor} passed`);
    }
} finally {
    await browser?.close();
    await server.close();
    await fs.rm(cacheDir, { recursive: true, force: true });
}
