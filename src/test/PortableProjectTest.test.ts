// @vitest-environment node
import { expect, test } from 'vitest';
import JSZip from 'jszip';
import { exportProjectZip, fetchProjectAssets, importProjectZip, projectPath, referencedAssetPaths, workspacePaths } from '../client/workspace/PortableProject';
import type { ExportedWorkspace } from '../client/workspace/WorkspaceImporterExporter';

function workspace(flavor: string): ExportedWorkspace {
    return { name: 'game', id: 1, settings: { language: 'Java', libraries: flavor === 'nrw' ? ['scratch', 'nrw'] : ['scratch'],
        scratchProject: { lesson: 'course', checkpoint: '02', debugOnStart: true, customSetting: { retained: true } } },
        modules: [
            { id: 1, name: 'assets', text: '', isFolder: true, identical_to_repository_version: true },
            { id: 2, name: 'Main.java', text: 'import org.openpatch.scratch.*;\nvoid main() { new Stage(); }\n', isFolder: false, identical_to_repository_version: true },
            { id: 3, name: 'image.png', parent_folder_id: 1, text: 'data:image/png;base64,AAECA/8=', isFolder: false, identical_to_repository_version: true },
            { id: 4, name: 'sound.ogg', parent_folder_id: 1, text: 'data:audio/ogg;base64,T2dnUw==', isFolder: false, identical_to_repository_version: true },
            { id: 5, name: 'identity.frag', text: 'uniform sampler2D texture;\n', isFolder: false, identical_to_repository_version: true },
            { id: 6, name: 'font.ttf', parent_folder_id: 1, text: 'data:font/ttf;base64,AAECAw==', isFolder: false, identical_to_repository_version: true },
        ] };
}

test.each(['standard', 'nrw'])('%s projects preserve source, binary assets, folders and optional settings', async flavor => {
    const original = workspace(flavor);
    const bytes = await exportProjectZip(original);
    const archive = await JSZip.loadAsync(bytes);
    expect([...await archive.file('assets/image.png')!.async('uint8array')]).toEqual([0, 1, 2, 3, 255]);
    const { workspace: restored, warnings } = await importProjectZip(bytes);
    expect(warnings).toEqual([]);
    expect(restored.settings.libraries).toEqual(original.settings.libraries);
    expect(restored.settings.scratchProject).toMatchObject({ lesson: 'course', checkpoint: '02', startStage: 'Main',
        startFile: 'Main.java', customSetting: { retained: true } });
    for (const file of restored.modules) {
        const source = original.modules.find(candidate => workspacePaths(original).get(candidate) === workspacePaths(restored).get(file));
        expect(file.text).toBe(source!.text);
    }
});

test('nested folders and empty folders retain explorer IDs across a ZIP round trip', async () => {
    const zip = new JSZip().file('game/Main.java', 'void main() {}').file('game/assets/audio/coin.ogg', new Uint8Array([1, 2]));
    zip.folder('game/empty');
    const { workspace } = await importProjectZip(await zip.generateAsync({ type: 'uint8array' }));
    expect([...workspacePaths(workspace).values()]).toContain('assets/audio/coin.ogg');
    expect(workspace.modules.find(file => file.name === 'empty')?.isFolder).toBe(true);
    const restored = await JSZip.loadAsync(await exportProjectZip(workspace));
    expect(restored.files['empty/'].dir).toBe(true);
    expect([...await restored.file('assets/audio/coin.ogg')!.async('uint8array')]).toEqual([1, 2]);
});

test('Studio projects receive a browser entry point and retain desktop NRW classes as real source files', async () => {
    const zip = new JSZip();
    zip.file('game/.scratch4j/project.json', JSON.stringify({ version: 1, flavour: 'nrw', startStage: 'Welt',
        desktopFiles: ['List.java'], pixelArt: true, fullScreen: true }));
    zip.file('game/Welt.java', 'import org.openpatch.scratch.*;\nclass Welt extends Stage {}');
    zip.file('game/List.java', 'class List<T> {}');
    const result = await importProjectZip(await zip.generateAsync({ type: 'uint8array' }));
    expect(result.workspace.modules.find(file => file.name === 'ScratchProjectStart.java')?.text).toContain('new Welt();');
    expect(result.workspace.modules.find(file => file.name === 'List.java')?.text).toMatch(/^data:/);
    expect(result.warnings.join()).toContain('fullscreen');
    const restored = await JSZip.loadAsync(await exportProjectZip(result.workspace));
    expect(await restored.file('List.java')!.async('string')).toBe('class List<T> {}');
});

test.each(['../escape.java', '/absolute.java', 'C:/Main.java', 'folder\\Main.java', 'CON.java', 'folder/../Main.java'])
    ('reject unsafe project path %s', name => expect(() => projectPath(name)).toThrow());

test('imports reject sanitized traversal names, conflicting names, invalid metadata and invalid UTF-8', async () => {
    for (const entries of [
        { '../Main.java': 'class Main {}' },
        { 'Main.java': 'class Main {}', 'main.java': 'class Main {}' },
        { 'Main.java': 'class Main {}', '.scratch4j/project.json': '{"portableVersion":2}' },
        { 'Main.java': new Uint8Array([0xff]) },
    ]) {
        const zip = new JSZip();
        for (const [name, value] of Object.entries(entries)) zip.file(name, value);
        await expect(importProjectZip(await zip.generateAsync({ type: 'uint8array' }))).rejects.toThrow();
    }
});

test('corrupt archive contents and oversized compressed assets fail before workspace replacement', async () => {
    const zip = new JSZip().file('Main.java', 'void main() {}');
    const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'STORE' });
    const signature = new TextEncoder().encode('void main() {}');
    const offset = bytes.findIndex((_, index) => signature.every((byte, step) => bytes[index + step] === byte));
    bytes[offset] ^= 1;
    await expect(importProjectZip(bytes)).rejects.toThrow('Corrupt');
    zip.file('large.png', new Uint8Array(16 * 1024 * 1024 + 1));
    await expect(importProjectZip(await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }))).rejects.toThrow('limit');
});

test('unsupported features and external dependencies have explicit messages; legacy spritesheets cannot silently disappear', async () => {
    const original = workspace('standard');
    original.settings.scratchProject = { browserFeatures: ['Stage/getPixels'], libraryVersion: '99.0.0', externalDependencies: ['extra.jar'] };
    const result = await importProjectZip(await exportProjectZip(original));
    expect(result.warnings.join()).toContain('99.0.0');
    expect(result.warnings.join()).toContain('Stage/getPixels');
    expect(result.warnings.join()).toContain('extra.jar');
    original.spritesheetBase64 = 'AAAA';
    await expect(exportProjectZip(original)).rejects.toThrow('legacy spritesheet');
});


test('teaching manifests and original Scratch information survive transfer', async () => {
    const zip = new JSZip().file('game/Main.java', 'void main() {}')
        .file('game/.scratch4j/checks.json', '{"schemaVersion":1,"classes":["ScoreTest"]}')
        .file('game/.scratch4j/migration.json', '{"schemaVersion":1,"tasks":[]}')
        .file('game/.scratch4j/original.sb3', new Uint8Array([80, 75, 1, 2]))
        .file('game/.scratch4j/build/cache.java', 'invalid');
    const imported = await importProjectZip(await zip.generateAsync({ type: 'uint8array' }));
    const result = await JSZip.loadAsync(await exportProjectZip(imported.workspace));
    expect(await result.file('.scratch4j/checks.json')!.async('string')).toContain('ScoreTest');
    expect(await result.file('.scratch4j/migration.json')!.async('string')).toContain('tasks');
    expect([...await result.file('.scratch4j/original.sb3')!.async('uint8array')]).toEqual([80, 75, 1, 2]);
    expect(result.file('.scratch4j/build/cache.java')).toBeNull();
});

test('assets the program loads from next to the page, not from the workspace, go into the ZIP', async () => {
    const original = workspace('standard');
    original.modules[1].text = 'void main() { new Stage().addBackdrop("bg", "./assets/bg.png");\n'
        + '  addSound("s", "assets/sound.ogg"); String t = "Hallo \\"x.png\\""; load("https://example.org/a.png"); }\n';
    const paths = referencedAssetPaths(original, ['assets/walk1.png', 'cat', 'assets/bg.png']);
    expect(paths.sort()).toEqual(['assets/bg.png', 'assets/walk1.png']);
    const served: Record<string, Response> = {
        'https://book.example/kapitel/assets/bg.png': new Response(new Uint8Array([9, 8]), { headers: { 'content-type': 'image/png' } }),
        'https://book.example/kapitel/assets/walk1.png': new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } }),
    };
    const fetch = globalThis.fetch;
    globalThis.fetch = (async (url: string) => served[url] ?? new Response('', { status: 404 })) as any;
    try {
        const { files, missing } = await fetchProjectAssets(paths, path => 'https://book.example/kapitel/' + path);
        expect(missing).toEqual(['assets/walk1.png']);
        const archive = await JSZip.loadAsync(await exportProjectZip(original, files));
        expect([...await archive.file('assets/bg.png')!.async('uint8array')]).toEqual([9, 8]);
        expect([...await archive.file('assets/image.png')!.async('uint8array')]).toEqual([0, 1, 2, 3, 255]);
    } finally { globalThis.fetch = fetch; }
});
