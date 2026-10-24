import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import os from 'node:os';
import path from 'node:path';

const source = await fs.readFile(new URL('../src/test/browser/ExtensionsProbe.java', import.meta.url), 'utf8');
const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scratch4j-extensions-vite-'));
const server = await createServer({ configFile: false, cacheDir,
    server: { host: '127.0.0.1', port: 0, hmr: false }, define: { APP_VERSION: JSON.stringify('test'), BUILD_DATE: JSON.stringify('test') } });
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
            const snapshot = window.scratchTest.snapshot();
            if (snapshot.error) throw new Error(`${snapshot.exception}\n${snapshot.output}`);
            return snapshot.output?.includes('EXTENSIONS_READY');
        }, undefined, { timeout: 20000 });
        assert.equal((await page.evaluate(() => window.scratchTest.snapshot())).renderer, 1);
        for (let frame = 1; frame <= 30; frame++) {
            await page.evaluate(() => window.scratchTest.step());
            await page.waitForFunction(frame => {
                const snapshot = window.scratchTest.snapshot();
                if (snapshot.error) throw new Error(`${snapshot.exception}\n${snapshot.output}`);
                return snapshot.steps === frame;
            }, frame);
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            if (![6, 14, 22, 30].includes(frame)) continue;
            const points = [[30,-20],[45,-20],[80,-20],[0,-70],[-100,60],[50,-50],[-60,60],[-20,60],[-98,-2],[-82,-2],[8,-8]];
            const actual = await page.evaluate(points => window.scratchTest.pixels(points), points);
            const white = [255,255,255], red = [255,0,0], blue = [0,0,255];
            // the shown Tiled layer survives eraseAll: showLayer draws every frame (7.0)
            const expected = [[0,255,0],white,blue,red,frame<24?red:white,frame<24?blue:white,
                frame===6?red:white,frame===14?red:white,frame===6?red:white,frame===14?red:white,[160,0,160]];
            assert.deepEqual(actual, expected, `${flavor}, frame ${frame}: drawing, UI redraw, persistent pen/stamps and bitmap text`);
        }
        const tiled = await page.evaluate(async () => {
            const { ScratchTiledMapClass } = await import('/src/compiler/java/runtime/graphics/scratch/ScratchTiledMapClass.ts');
            const { activeScratchStage } = await import('/src/compiler/java/runtime/graphics/scratch/ScratchStages.ts');
            const stage = activeScratchStage();
            const map = new ScratchTiledMapClass();
            map.stage = stage;
            await map.load('/test/extensions-map.tmx');
            const ground = map.layers.get('ground');
            ground.data = ground.data.map(raw => (raw | 0x10000000) >>> 0);
            const stamp = () => map._mj$stampLayerToBackground$void$string({}, undefined, 'ground');
            stage._eraseAll();
            stamp();
            const layer = stage.scratchLayers.backgroundStamps;
            const snapshot = layer.children[0], sprite = snapshot.children[0];
            const source = sprite.texture.source;
            const listeners = source.listenerCount('resize');
            const expected = window.scratchTest.pixels([[8, -8], [24, -8]]);
            let reused = true;
            for (let frame = 0; frame < 120; frame++) {
                stage._eraseAll();
                stamp();
                reused &&= layer.children[0] === snapshot && snapshot.children[0] === sprite;
            }
            const actual = window.scratchTest.pixels([[8, -8], [24, -8]]);
            stamp();
            return { reused, expected, actual, extraListeners: source.listenerCount('resize') - listeners,
                independentCopies: layer.children.length === 2 && layer.children[0] !== layer.children[1] };
        });
        assert.equal(tiled.reused, true, `${flavor}: erased Tiled snapshots reuse their sprites`);
        assert.equal(tiled.extraListeners, 0, `${flavor}: repeated stamps do not retain more tile textures`);
        assert.equal(tiled.independentCopies, true, `${flavor}: stamps without an erase remain separate copies`);
        assert.deepEqual(tiled.actual, tiled.expected, `${flavor}: cached map rendering matches the first stamp`);
        assert.deepEqual(errors, []);
        await page.evaluate(() => window.scratchTest.stop());
        await page.close();
        console.log(`Drawing, bitmap text, UI persistence and Tiled data: ${flavor} passed`);
    }
} finally {
    await browser?.close();
    await server.close();
    await fs.rm(cacheDir, { recursive: true, force: true });
}
