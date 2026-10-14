import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const server = await createServer({ configFile: false, server: { host: '127.0.0.1', port: 0 },
    define: { APP_VERSION: JSON.stringify('test'), BUILD_DATE: JSON.stringify('test') } });
let browser;
try {
    await server.listen();
    const port = server.httpServer.address().port;
    browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = `http://127.0.0.1:${port}/src/test/browser/scratch.html`;
    async function run(source, flavor, expected) {
        await page.evaluate(({ source, flavor }) => window.scratchTest.start(source, flavor), { source, flavor });
        await page.waitForFunction(expected => {
            const value = window.scratchTest.snapshot();
            if (value.error) throw new Error(`${value.exception}\n${value.output}`);
            return value.output?.includes(expected);
        }, expected, { timeout: 15000 });
        await page.evaluate(() => window.scratchTest.stop());
    }
    for (const flavor of ['standard', 'nrw']) {
        await page.goto(url);
        await page.waitForFunction(() => !!window.scratchTest);
        const gameId = `org.openpatch.savetest.${flavor}`;
        const types = `
            import java.io.IOException;
            import org.openpatch.scratch.extensions.fs.SaveData;
            class Child { public int number = 5; }
            class Progress {
                public int version = 1;
                public int coins = 0;
                public String name = "Hedgehog 🦔";
                public int[] collected = {1, 2};
                public Child child = new Child();
                public Progress next;
                public transient int temporary = 7;
                private int secret = 9;
                public int getSecret() { return secret; }
            }
        `;
        await run(types + `void main() {
            try {
                for (int i = 1; i <= 3; i++) {
                    SaveData<Progress> save = new SaveData<>("${gameId}", "slot" + i, Progress.class);
                    Progress p = save.loadOrDefault(() -> new Progress());
                    p.coins = i * 10;
                    p.child.number = i;
                    save.save(p);
                }
                println("SAVED");
            } catch (IOException error) { println("FAIL " + error.getMessage()); }
        }`, flavor, 'SAVED');
        // A real page reload destroys the interpreter and every in-memory save object.
        await page.reload();
        await page.waitForFunction(() => !!window.scratchTest);
        await run(types + `void main() {
            try {
                for (int i = 1; i <= 3; i++) {
                    SaveData<Progress> save = new SaveData<>("${gameId}", "slot" + i, Progress.class);
                    Progress p = save.loadOrDefault(() -> { println("UNEXPECTED_DEFAULT"); return new Progress(); });
                    println("slot" + i + ":" + p.coins + ":" + p.child.number + ":" + p.collected[1] + ":" + p.name);
                }
                println("LOADED");
            } catch (IOException error) { println("FAIL " + error.getMessage()); }
        }`, flavor, 'LOADED');
        const output = await page.evaluate(() => window.scratchTest.snapshot().output);
        assert.equal(output, 'slot1:10:1:2:Hedgehog 🦔\nslot2:20:2:2:Hedgehog 🦔\nslot3:30:3:2:Hedgehog 🦔\nLOADED\n');
        const records = await page.evaluate(async gameId => {
            const { readScratchSave } = await import('/src/compiler/java/runtime/graphics/scratch/ScratchSaveDataStore.ts');
            return Promise.all([1, 2, 3].map(i => readScratchSave(gameId, 'slot' + i)));
        }, gameId);
        assert.equal(JSON.parse(records[0]).coins, 10);
        assert.equal('temporary' in JSON.parse(records[0]), false);
        assert.equal('secret' in JSON.parse(records[0]), false);
        await page.evaluate(async gameId => {
            const { writeScratchSave } = await import('/src/compiler/java/runtime/graphics/scratch/ScratchSaveDataStore.ts');
            await writeScratchSave(gameId, 'slot2', '{broken');
            await writeScratchSave(gameId, 'older', '{"coins":7}');
        }, gameId);
        await run(types + `void main() {
            try {
                SaveData<Progress> save = new SaveData<>("${gameId}", "slot2", Progress.class);
                save.loadOrDefault(() -> { println("UNEXPECTED_DEFAULT"); return new Progress(); });
                println("UNEXPECTED_SUCCESS");
            } catch (IOException error) { println("CORRUPT_REPORTED"); }
            try {
                SaveData<Progress> save = new SaveData<>("${gameId}", "older", Progress.class);
                Progress p = save.loadOrDefault(() -> new Progress());
                println("older:" + p.coins + ":" + p.version + ":" + p.child.number);
            } catch (IOException error) { println("FAIL " + error.getMessage()); }
            println("CHECKED");
        }`, flavor, 'CHECKED');
        assert.equal(await page.evaluate(() => window.scratchTest.snapshot().output),
            'CORRUPT_REPORTED\nolder:7:1:5\nCHECKED\n');
        assert.equal(await page.evaluate(async gameId => {
            const { readScratchSave } = await import('/src/compiler/java/runtime/graphics/scratch/ScratchSaveDataStore.ts');
            return readScratchSave(gameId, 'slot2');
        }, gameId), '{broken');
        await run(types + `void main() {
            SaveData<Progress> save = new SaveData<>("${gameId}", "slot1", Progress.class);
            Progress p = new Progress();
            p.next = p;
            try { save.save(p); println("UNEXPECTED_SUCCESS"); }
            catch (IOException error) { println("CYCLE_REPORTED"); }
        }`, flavor, 'CYCLE_REPORTED');
        await page.evaluate(() => {
            window.originalSavePut = IDBObjectStore.prototype.put;
            IDBObjectStore.prototype.put = function(value, key) {
                const request = window.originalSavePut.call(this, value, key);
                if (this.name === 'saves') this.transaction.abort();
                return request;
            };
        });
        await run(types + `void main() {
            SaveData<Progress> save = new SaveData<>("${gameId}", "slot1", Progress.class);
            try { save.save(new Progress()); println("UNEXPECTED_SUCCESS"); }
            catch (IOException error) { println("WRITE_FAILURE_REPORTED"); }
        }`, flavor, 'WRITE_FAILURE_REPORTED');
        await page.evaluate(() => { IDBObjectStore.prototype.put = window.originalSavePut; });
        assert.equal(await page.evaluate(async gameId => {
            const { readScratchSave } = await import('/src/compiler/java/runtime/graphics/scratch/ScratchSaveDataStore.ts');
            return JSON.parse(await readScratchSave(gameId, 'slot1')).coins;
        }, gameId), 10, 'cyclic data and aborted transactions preserve the committed save');
        await run(types + `void main() {
            try {
                SaveData<Progress> save = new SaveData<>("${gameId}", "large", Progress.class);
                Progress p = new Progress();
                p.collected = new int[20000];
                p.collected[19999] = 42;
                save.save(p);
                Progress loaded = save.loadOrDefault(() -> new Progress());
                println("large:" + loaded.collected.length + ":" + loaded.collected[19999]);
            } catch (IOException error) { println("FAIL " + error.getMessage()); }
        }`, flavor, 'large:20000:42');
        console.log(`SaveData IndexedDB commits, reload, three slots and corruption: ${flavor} passed`);

        const demo = (await fs.readFile(new URL('../public/examples/save-slots.java', import.meta.url), 'utf8'))
            .replace('window.setStage(new SaveSlotStage());', 'window.setStage(new SaveSlotStage()); println("GAME_READY");');
        await page.evaluate(async () => {
            const { writeScratchSave } = await import('/src/compiler/java/runtime/graphics/scratch/ScratchSaveDataStore.ts');
            for (let slot = 1; slot <= 3; slot++) {
                await writeScratchSave('org.openpatch.coinquest', 'slot' + slot,
                    JSON.stringify({ version: 1, coins: slot * 10, playerX: -180, playerY: -60, coinX: 120, coinY: 0 }));
            }
        });
        async function gameState() {
            return page.evaluate(async () => {
                const { activeScratchStage } = await import('/src/compiler/java/runtime/graphics/scratch/ScratchStages.ts');
                const stage = activeScratchStage();
                const fields = stage.getType().getOwnAndInheritedFields();
                const get = name => stage[fields.find(field => field.identifier === name).getInternalName()];
                return { coins: get('coins'), slot: get('selectedSlot'), busy: get('busy'),
                    playerX: get('player')._getX(), playerY: get('player')._getY(),
                    coinX: get('coin')._getX(), coinY: get('coin')._getY() };
            });
        }
        async function waitForGame(predicate) {
            const deadline = Date.now() + 15000;
            while (!predicate(await gameState())) {
                if (Date.now() > deadline) throw new Error('Timed out waiting for game controls: ' + JSON.stringify(await gameState()));
                await new Promise(resolve => setTimeout(resolve, 30));
            }
        }
        await page.evaluate(({ source, flavor }) => window.scratchTest.start(source, flavor), { source: demo, flavor });
        await page.waitForFunction(() => window.scratchTest.snapshot().output?.includes('GAME_READY'));
        for (let slot = 1; slot <= 3; slot++) {
            await page.keyboard.press(String(slot));
            await page.keyboard.press('l');
            await waitForGame(state => !state.busy && state.slot === slot && state.coins === slot * 10);
        }
        await page.keyboard.press('r');
        await waitForGame(state => state.coins === 0);
        await page.keyboard.down('ArrowRight');
        await waitForGame(state => state.playerX >= 110);
        await page.keyboard.up('ArrowRight');
        await page.keyboard.down('ArrowUp');
        await waitForGame(state => state.coins >= 1);
        await page.keyboard.up('ArrowUp');
        await page.keyboard.press('s');
        // The key event can still be queued while busy is false. Observe the
        // committed save before reading it, rather than treating that initial
        // idle state as proof that the save handler has finished.
        await page.waitForFunction(async () => {
            const { readScratchSave } = await import('/src/compiler/java/runtime/graphics/scratch/ScratchSaveDataStore.ts');
            const saved = JSON.parse(await readScratchSave('org.openpatch.coinquest', 'slot3'));
            return saved.coins >= 1 && saved.coins < 30;
        }, undefined, { timeout: 15000 });
        await waitForGame(state => !state.busy);
        const demoSaves = await page.evaluate(async () => {
            const { readScratchSave } = await import('/src/compiler/java/runtime/graphics/scratch/ScratchSaveDataStore.ts');
            return Promise.all([1, 2, 3].map(async slot =>
                JSON.parse(await readScratchSave('org.openpatch.coinquest', 'slot' + slot))));
        });
        assert.deepEqual(demoSaves.slice(0, 2), [1, 2].map(slot => ({
            version: 1, coins: slot * 10, playerX: -180, playerY: -60, coinX: 120, coinY: 0,
        })), 'saving slot 3 preserves slots 1 and 2');
        const saved = demoSaves[2];
        assert.ok(saved.coins >= 1 && saved.coins < 30, 'actual gameplay and save controls overwrite only the selected slot');
        await page.waitForFunction(() => window.scratchTest.snapshot().renderer === 1);
        const canvas = await page.locator('#graphics canvas').boundingBox();
        assert.ok(canvas?.width > 0 && canvas?.height > 0, 'demo canvas must be visible: ' + JSON.stringify(await page.evaluate(() => ({
            html: document.getElementById('graphics').outerHTML,
            rects: [...document.querySelectorAll('#graphics, #graphics *')].map(element => ({
                tag: element.tagName, cls: element.className, rect: element.getBoundingClientRect().toJSON(),
            })),
        }))));
        const artifacts = process.env.SCRATCH_BROWSER_ARTIFACTS || path.join(os.tmpdir(), 'scratch-browser-tests');
        await fs.mkdir(artifacts, { recursive: true });
        await page.screenshot({ path: path.join(artifacts, `save-slots-${flavor}.png`) });
        await page.evaluate(() => window.scratchTest.stop());
        await page.reload();
        await page.waitForFunction(() => !!window.scratchTest);
        await page.evaluate(({ source, flavor }) => window.scratchTest.start(source, flavor), { source: demo, flavor });
        await page.waitForFunction(() => window.scratchTest.snapshot().output?.includes('GAME_READY'));
        await page.keyboard.press('3');
        await page.keyboard.press('l');
        await waitForGame(state => !state.busy && state.coins === saved.coins);
        const restored = await gameState();
        assert.equal(restored.playerX, saved.playerX);
        assert.equal(restored.playerY, saved.playerY);
        assert.equal(restored.coinX, saved.coinX);
        assert.equal(restored.coinY, saved.coinY);
        await page.evaluate(() => window.scratchTest.stop());
        console.log(`Coin Quest keyboard controls, built-in assets and reload: ${flavor} passed`);
    }
    assert.deepEqual(errors, []);
} finally {
    await browser?.close();
    await server.close();
}
