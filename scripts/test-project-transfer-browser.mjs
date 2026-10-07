import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import JSZip from 'jszip';

const server = await createServer({ configFile: false, server: { host: '127.0.0.1', port: 0 },
    define: { APP_VERSION: JSON.stringify('test'), BUILD_DATE: JSON.stringify('test') } });
let browser;
try {
    await server.listen();
    const port = server.httpServer.address().port;
    browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
    const page = await browser.newPage();
    const errors = [];
    const alerts = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', async dialog => {
        if (dialog.type() === 'prompt') await dialog.accept('roundtrip.zip');
        else { alerts.push(dialog.message()); await dialog.accept(); }
    });
    await page.goto(`http://127.0.0.1:${port}/src/test/browser/transfer.html`);
    await page.waitForFunction(() => !!window.transferTest, undefined, { timeout: 30000 });
    const source = 'import org.openpatch.scratch.*;\nvoid main() { println("student edit"); }\n';
    const workspace = { name: 'Classroom game', settings: { language: 'Java', libraries: ['scratch', 'nrw'],
        scratchProject: { lesson: 'roundtrip', checkpoint: '02' } }, modules: [
        { name: 'Main.java', text: source },
        { name: 'assets/image.png', text: 'data:image/png;base64,AAECA/8=' },
        { name: 'assets/sound.ogg', text: 'data:audio/ogg;base64,T2dnUw==' },
        { name: 'identity.frag', text: 'uniform sampler2D texture;\n' },
    ] };
    const bytes = Buffer.from(await page.evaluate(workspace => window.transferTest.makeZip(workspace), workspace));
    await page.locator('input[accept=".json,.zip"]').setInputFiles({ name: 'game.zip', mimeType: 'application/zip', buffer: bytes });
    await page.waitForFunction(() => window.transferTest.snapshot().settings.libraries.includes('nrw'));
    await page.waitForFunction(async () => JSON.parse(await window.transferTest.saved() || '{}').settings?.libraries?.includes('nrw'));
    const loaded = await page.evaluate(() => window.transferTest.snapshot());
    await page.reload();
    await page.waitForFunction(() => !!window.transferTest, undefined, { timeout: 30000 });
    assert.deepEqual(await page.evaluate(() => window.transferTest.snapshot()), loaded, 'reload recovers files and project settings');
    const edited = source.replace('student edit', 'continued in browser');
    await page.evaluate(edited => window.transferTest.edit('Main.java', edited), edited);
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'ZIP', exact: true }).click();
    const download = await downloaded;
    const artifacts = process.env.SCRATCH_BROWSER_ARTIFACTS || path.join(os.tmpdir(), 'scratch-browser-tests');
    await fs.mkdir(artifacts, { recursive: true });
    const target = path.join(artifacts, 'browser-project.zip');
    await download.saveAs(target);
    const zip = await JSZip.loadAsync(await fs.readFile(target));
    assert.equal(await zip.file('Main.java').async('string'), edited);
    assert.deepEqual([...await zip.file('assets/image.png').async('uint8array')], [0, 1, 2, 3, 255]);
    assert.equal(await zip.file('identity.frag').async('string'), 'uniform sampler2D texture;\n');
    const metadata = JSON.parse(await zip.file('.scratch4j/project.json').async('string'));
    assert.equal(metadata.flavour, 'nrw');
    assert.equal(metadata.lesson, 'roundtrip');
    assert.deepEqual(alerts, []);
    if (process.env.SCRATCH_TRANSFER_INPUT) {
        const input = process.env.SCRATCH_TRANSFER_INPUT;
        await page.locator('input[accept=".json,.zip"]').setInputFiles(input);
        await page.waitForFunction(() => window.transferTest.snapshot().settings.scratchProject?.sourceEnvironment === 'studio');
        assert.deepEqual(await page.evaluate(() => window.transferTest.compile()), []);
        const files = await page.evaluate(() => window.transferTest.snapshot().files);
        assert.ok(files.some(file => file.name === 'Main.java' && file.text.includes('continued in Studio')));
        assert.ok(files.some(file => file.name === 'assets/image.png' && file.text.endsWith('AAECA/8=')));
        console.log('Studio ZIP reopened and compiled in the embedded browser: passed');
        await page.locator('input[accept=".json,.zip"]').setInputFiles({ name: 'game.zip', mimeType: 'application/zip', buffer: bytes });
        await page.waitForFunction(() => window.transferTest.snapshot().settings.scratchProject?.sourceEnvironment === 'browser');
        await page.evaluate(edited => window.transferTest.edit('Main.java', edited), edited);
    }
    const rejected = page.waitForEvent('dialog');
    await page.locator('input[accept=".json,.zip"]').setInputFiles({ name: 'corrupt.zip', mimeType: 'application/zip', buffer: Buffer.from('broken archive') });
    await rejected;
    assert.equal(alerts.length, 1);
    assert.equal(await page.evaluate(() => window.transferTest.snapshot().files.find(file => file.name === 'Main.java').text), edited);
    if (process.env.SCRATCH_CHECKPOINT_DIR) {
        const folder = process.env.SCRATCH_CHECKPOINT_DIR;
        for (const name of (await fs.readdir(folder)).filter(name => name.endsWith('.json')).sort()) {
            const checkpoint = JSON.parse(await fs.readFile(path.join(folder, name), 'utf8'));
            await page.locator('input[accept=".json,.zip"]').setInputFiles(path.join(folder, name));
            await page.waitForFunction(id => window.transferTest.snapshot().settings.scratchProject?.checkpoint === id,
                checkpoint.settings.scratchProject.checkpoint);
            assert.deepEqual(await page.evaluate(() => window.transferTest.compile()), [], name);
            assert.ok(await page.evaluate(() => window.transferTest.snapshot().files.some(file =>
                file.name === 'assets/actor/character/boy/sprite-sheet.png' && file.text.startsWith('data:image/png;base64,'))));
            console.log('Portable curriculum checkpoint compiled: ' + name);
        }
    }
    assert.deepEqual(errors, []);
    await page.close();
    console.log('Embedded project ZIP import/export, asset preservation and reload recovery: passed');
} finally { await browser?.close(); await server.close(); }
