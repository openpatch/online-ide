import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import JSZip from 'jszip';

const [checkpointPath, studioPath] = process.argv.slice(2);
if (!checkpointPath || !studioPath) throw new Error('Usage: test-curriculum-transfer.mjs <checkpoint.json> <built-studio-checkout>');
const studio = path.resolve(studioPath);
const checkpoint = JSON.parse(await fs.readFile(checkpointPath, 'utf8'));
const classpath = ['core', 'runner', 'export'].map(module => path.join(studio, module, 'target/classes'));
classpath.push(...(await fs.readdir(path.join(studio, 'app/target/libs'))).filter(name => name.endsWith('.jar'))
    .map(name => path.join(studio, 'app/target/libs', name)));
const cli = (...args) => execFileSync('java', ['-cp', classpath.join(path.delimiter),
    'org.openpatch.scratch4j.export.ProjectTransferCli', ...args], { encoding: 'utf8', timeout: 60000 }).trim();
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'scratch-curriculum-transfer-'));
const server = await createServer({ configFile: false, server: { host: '127.0.0.1', port: 0 },
    define: { APP_VERSION: JSON.stringify('test'), BUILD_DATE: JSON.stringify('test') } });
let browser;
try {
    await server.listen();
    browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.type() === 'prompt' ? dialog.accept('student.zip') : dialog.dismiss());
    await page.goto('http://127.0.0.1:' + server.httpServer.address().port + '/src/test/browser/transfer.html');
    await page.waitForFunction(() => !!window.transferTest);
    await page.locator('input[accept=".json,.zip"]').setInputFiles(path.resolve(checkpointPath));
    await page.waitForFunction(id => window.transferTest.snapshot().settings.scratchProject?.checkpoint === id,
        checkpoint.settings.scratchProject.checkpoint);
    assert.deepEqual(await page.evaluate(() => window.transferTest.compile()), []);
    const main = checkpoint.modules.find(file => file.name === 'Main.java').text;
    const edited = main.replace('new Window(768, 432)', 'new Window(800, 450)') + '\n// continued in browser\n';
    await page.evaluate(source => window.transferTest.edit('Main.java', source), edited);
    const download = page.waitForEvent('download');
    // the export button opens a dialog; its first option saves the ZIP for a local IDE
    await page.locator('.img_export-dark').click();
    await page.locator('.joe_exportDialog input').first().fill('student.zip');
    await page.locator('.joe_exportDialog .joe_exportButton').first().click();
    const browserZip = path.join(temporary, 'browser.zip');
    await (await download).saveAs(browserZip);
    const imported = cli('import', browserZip, path.join(temporary, 'studio'));
    const source = path.join(imported, 'Main.java');
    await fs.writeFile(source, (await fs.readFile(source, 'utf8')).replace('new Window(800, 450)', 'new Window(816, 450)')
        + '\n// continued in Studio\n');
    const flavor = checkpoint.settings.scratchProject.flavour === 'nrw' ? '-nrw' : '';
    const bundled = process.env.SCRATCH_TRANSFER_LIBRARIES || path.join(studio, 'runner/target/bundled');
    const library = 'scratch-' + checkpoint.settings.scratchProject.libraryVersion + flavor + '-all.jar';
    await fs.mkdir(path.join(imported, '+libs'), { recursive: true });
    await fs.copyFile(path.join(bundled, library), path.join(imported, '+libs', library));
    // The Studio runner compiles every source and executes the transferred score checks.
    const testOutput = execFileSync('java', ['-cp', classpath.join(path.delimiter),
        'org.openpatch.scratch4j.runner.TeachingTestRunner', imported], { encoding: 'utf8', timeout: 45000 });
    assert.match(testOutput, /4 tests successful/);
    const studioZip = path.join(temporary, 'studio.zip');
    cli('export', imported, studioZip);
    await page.locator('input[accept=".json,.zip"]').setInputFiles(studioZip);
    await page.waitForFunction(() => window.transferTest.snapshot().settings.scratchProject?.sourceEnvironment === 'studio');
    assert.deepEqual(await page.evaluate(() => window.transferTest.compile()), []);
    const returned = await page.evaluate(() => window.transferTest.snapshot());
    assert.match(returned.files.find(file => file.name === 'Main.java').text, /new Window\(816, 450\)/);
    assert.ok(returned.files.some(file => file.name === '.scratch4j/checks.json'));
    const originalArchive = await JSZip.loadAsync(await fs.readFile(browserZip));
    const returnedArchive = await JSZip.loadAsync(await fs.readFile(studioZip));
    const root = Object.keys(returnedArchive.files).find(name => name.endsWith('/.scratch4j/project.json'))
        .slice(0, -'.scratch4j/project.json'.length);
    for (const [name, file] of Object.entries(originalArchive.files)) {
        if (file.dir || name === 'Main.java' || name === '.scratch4j/project.json') continue;
        const actual = await returnedArchive.file(root + name).async('uint8array');
        const expected = await file.async('uint8array');
        if (name.endsWith('.java') && !checkpoint.settings.scratchProject.desktopFiles.includes(name)) {
            // Studio adds the browser's implicit imports; existing imports and the body are retained.
            const decoder = new TextDecoder();
            const original = decoder.decode(expected);
            const returned = decoder.decode(actual);
            const imports = text => text.match(/^import[^;]+;\s*$/gm) ?? [];
            for (const statement of imports(original)) assert.ok(imports(returned).some(value => value.trim() === statement.trim()), name);
            const body = text => text.replace(/^import[^;]+;\s*$/gm, '').trim();
            assert.equal(body(returned), body(original), name);
        } else assert.deepEqual(actual, expected, name);
    }
    assert.deepEqual(errors, []);
    console.log('Edited Spielwerkstatt browser > Studio > browser, all assets/NRW classes/checks preserved; four transferred checks pass');
} finally {
    await browser?.close();
    await server.close();
    await fs.rm(temporary, { recursive: true, force: true });
}
