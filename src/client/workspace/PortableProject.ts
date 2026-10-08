import JSZip from 'jszip';
import type { ExportedWorkspace, ExportedFile } from './WorkspaceImporterExporter';
import { scratchDesktopVersion, scratchBrowserMembers } from '../../compiler/java/runtime/graphics/scratch/ScratchCompatibility';
const contract = { desktopVersion: scratchDesktopVersion, members: scratchBrowserMembers };

const METADATA = '.scratch4j/project.json';
// a workspace that is no Scratch project: its settings, its binary files, its legacy spritesheet
const WORKSPACE_METADATA = '.online-ide/workspace.json';
const WORKSPACE_SPRITESHEET = '.online-ide/spritesheet.zip';
const MAX_FILE = 16 * 1024 * 1024;
const MAX_TOTAL = 64 * 1024 * 1024;
const TEXT = /\.(java|md|txt|json|xml|tmx|tsx|frag|vert|glsl|csv|properties)$/i;
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    svg: 'image/svg+xml', gif: 'image/gif', webp: 'image/webp', wav: 'audio/wav', mp3: 'audio/mpeg',
    ogg: 'audio/ogg', ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2' };

export function projectPath(name: string): string {
    if (typeof name !== 'string' || !name || /[\\:\x00-\x1f]/.test(name)
        || name.startsWith('/') || name.split('/').some(part => !part || part === '.' || part === '..'
            || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(part))) {
        throw new Error(`Invalid project path: ${name}`);
    }
    return name;
}

function bytesOf(text: string): Uint8Array {
    if (!text.startsWith('data:')) return new TextEncoder().encode(text);
    const comma = text.indexOf(',');
    if (comma < 0) throw new Error('Invalid asset data URL');
    if (!text.slice(0, comma).endsWith(';base64')) return new TextEncoder().encode(decodeURIComponent(text.slice(comma + 1)));
    return Uint8Array.from(atob(text.slice(comma + 1)), character => character.charCodeAt(0));
}

function dataUrl(bytes: Uint8Array, name: string): string {
    let binary = '';
    for (let index = 0; index < bytes.length; index += 8192) binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
    return `data:${MIME[name.split('.').pop()!.toLowerCase()] || 'application/octet-stream'};base64,${btoa(binary)}`;
}

const crcTable = Array.from({ length: 256 }, (_, value) => {
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
    return value;
});
function crc32(bytes: Uint8Array): number {
    let value = -1;
    for (const byte of bytes) value = (value >>> 8) ^ crcTable[(value ^ byte) & 255];
    return value ^ -1;
}

export function workspacePaths(workspace: ExportedWorkspace): Map<ExportedFile, string> {
    const byId = new Map(workspace.modules.filter(file => file.id != null).map(file => [file.id, file]));
    if (byId.size !== workspace.modules.filter(file => file.id != null).length) throw new Error('Duplicate workspace file IDs');
    const paths = new Map<ExportedFile, string>();
    const names = new Set<string>();
    for (const file of workspace.modules) {
        const seen = new Set<ExportedFile>([file]);
        const parts = [file.name];
        let parentId = file.parent_folder_id;
        while (parentId != null) {
            const parent = byId.get(parentId);
            if (!parent?.isFolder || seen.has(parent)) throw new Error(`Invalid folder for ${file.name}`);
            seen.add(parent);
            parts.unshift(parent.name);
            parentId = parent.parent_folder_id;
        }
        const name = projectPath(parts.join('/'));
        if (names.has(name.toLowerCase())) throw new Error(`Conflicting project filename: ${name}`);
        names.add(name.toLowerCase());
        paths.set(file, name);
    }
    return paths;
}

function metadataWarnings(metadata: any): string[] {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('Invalid project metadata');
    if ((metadata.version ?? 1) !== 1 || (metadata.portableVersion ?? 1) !== 1) throw new Error('Unsupported project metadata version');
    if (metadata.flavour && !['standard', 'nrw'].includes(metadata.flavour)) throw new Error(`Unsupported library flavour: ${metadata.flavour}`);
    for (const name of ['browserFeatures', 'externalDependencies', 'desktopFiles']) {
        if (metadata[name] != null && (!Array.isArray(metadata[name]) || metadata[name].some(value => typeof value !== 'string'))) {
            throw new Error(`Invalid metadata field: ${name}`);
        }
    }
    if (metadata.startFile) projectPath(metadata.startFile);
    const warnings: string[] = [];
    if (metadata.libraryVersion && metadata.libraryVersion !== contract.desktopVersion) {
        warnings.push(`Project requires Scratch for Java ${metadata.libraryVersion}; this browser implements ${contract.desktopVersion}. Review compatibility before running.`);
    }
    for (const id of metadata.browserFeatures ?? []) {
        const member = contract.members.find(member => member.id === id);
        if (member?.status !== 'implemented') warnings.push(`Required browser feature ${id}: ${member?.reason || 'not listed in this browser revision'}`);
    }
    if (metadata.externalDependencies?.length) warnings.push(`External dependencies must be supplied separately: ${metadata.externalDependencies.join(', ')}`);
    return warnings;
}

const ASSET = /\.(png|jpe?g|svg|gif|webp|wav|mp3|ogg|ttf|otf|woff2?|frag|vert|glsl|json|tmx|tsx|csv|txt)$/i;

/**
 * Relative paths of files a program loads that are not part of its workspace.
 *
 * In the browser `addCostume("hero", "assets/hero.png")` may load a file that
 * lies next to the page embedding the IDE (see ScratchAssetUrls) instead of one
 * handed over with `@file`. Studio has no such page, so these files have to go
 * into the ZIP. Candidates are the string literals of the Java sources plus the
 * paths runs have asked for, which covers names built at run time.
 */
export function referencedAssetPaths(workspace: ExportedWorkspace, requested: string[] = []): string[] {
    const own = new Set([...workspacePaths(workspace).values()].map(name => name.toLowerCase()));
    const literals = workspace.modules.filter(file => !file.isFolder && /\.java$/i.test(file.name))
        .flatMap(file => [...file.text.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)].map(match => match[1].replace(/\\(["\\])/g, '$1')));
    const paths = new Set<string>();
    for (const candidate of [...literals, ...requested]) {
        const path = candidate.replace(/^\.\//, '');
        if (!ASSET.test(path) || /^[a-z][a-z0-9+.-]*:/i.test(path) || own.has(path.toLowerCase())) continue;
        try { paths.add(projectPath(path)); } catch { /* not a file path */ }
    }
    return [...paths];
}

/** Downloads the given project files; the ones that cannot be had are reported. */
export async function fetchProjectAssets(paths: string[], resolve: (path: string) => string):
    Promise<{ files: Map<string, Uint8Array>, missing: string[] }> {
    const files = new Map<string, Uint8Array>();
    const missing: string[] = [];
    await Promise.all(paths.map(async path => {
        try {
            const response = await fetch(resolve(path));
            // a dev server or SPA host answers an unknown path with its index page
            if (!response.ok || /text\/html/i.test(response.headers.get('content-type') ?? '')) throw new Error(String(response.status));
            files.set(path, new Uint8Array(await response.arrayBuffer()));
        } catch { missing.push(path); }
    }));
    return { files, missing: missing.sort() };
}

/**
 * A Scratch for Java project Studio can open: Java with the Scratch library and
 * at most the NRW classes next to it. Every other workspace is exported as a
 * workspace ZIP that carries its settings for the way back.
 */
export function isScratchProject(workspace: ExportedWorkspace): boolean {
    const libraries = workspace.settings?.libraries ?? [];
    return workspace.settings?.language === 'Java' && libraries.includes('scratch')
        && libraries.every(id => ['scratch', 'nrw'].includes(id));
}

/** Adds the workspace's files and the extra files to the ZIP, within the size limits. */
function addFiles(zip: JSZip, workspace: ExportedWorkspace, extraFiles: Map<string, Uint8Array>, reserved: string[]) {
    const paths = workspacePaths(workspace);
    if (paths.size > 2000) throw new Error('Project has more than 2,000 files');
    let total = 0;
    for (const [file, name] of paths) {
        if (file.isFolder) { zip.folder(name); continue; }
        if (reserved.includes(name)) continue;
        const bytes = bytesOf(file.text);
        total += bytes.length;
        if (bytes.length > MAX_FILE || total > MAX_TOTAL) throw new Error(`Project asset limit exceeded: ${name}`);
        zip.file(name, bytes);
    }
    const names = new Set([...paths.values()].map(name => name.toLowerCase()));
    for (const [path, bytes] of extraFiles) {
        const name = projectPath(path);
        if (reserved.includes(name) || names.has(name.toLowerCase())) continue;
        names.add(name.toLowerCase());
        total += bytes.length;
        if (bytes.length > MAX_FILE || total > MAX_TOTAL) throw new Error(`Project asset limit exceeded: ${name}`);
        zip.file(name, bytes);
    }
    return paths;
}

/** The workspace as a ZIP for a local IDE: a Scratch project for Studio, or a workspace ZIP. */
export async function exportProjectZip(workspace: ExportedWorkspace, extraFiles: Map<string, Uint8Array> = new Map()): Promise<Uint8Array> {
    return isScratchProject(workspace) ? exportScratchZip(workspace, extraFiles) : exportWorkspaceZip(workspace, extraFiles);
}

async function exportScratchZip(workspace: ExportedWorkspace, extraFiles: Map<string, Uint8Array>): Promise<Uint8Array> {
    if (workspace.spritesheetBase64) throw new Error('Extract the legacy spritesheet into image files before exporting a portable project. Workspace JSON still preserves it.');
    const metadata: any = { version: 1, portableVersion: 1, libraryVersion: contract.desktopVersion,
        browserFeatures: [], externalDependencies: [], ...workspace.settings.scratchProject,
        flavour: workspace.settings.libraries!.includes('nrw') ? 'nrw' : 'standard', sourceEnvironment: 'browser' };
    const zip = new JSZip();
    const paths = addFiles(zip, workspace, extraFiles, [METADATA]);
    const entry = workspace.modules.find(file => !file.isFolder && /\bvoid\s+main\s*\(/.test(file.text));
    if (!metadata.startFile && entry) metadata.startFile = paths.get(entry);
    if (!metadata.startStage && entry) metadata.startStage = entry.name.replace(/\.java$/i, '').split('/').pop();
    metadataWarnings(metadata);
    zip.file(METADATA, JSON.stringify(metadata, null, 2) + '\n');
    return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

/**
 * Any other workspace - plain Java, other libraries, assembly: its files as
 * they are, and in .online-ide/ what the way back needs (settings, which files
 * are binary, the legacy spritesheet).
 */
async function exportWorkspaceZip(workspace: ExportedWorkspace, extraFiles: Map<string, Uint8Array>): Promise<Uint8Array> {
    const zip = new JSZip();
    const paths = addFiles(zip, workspace, extraFiles, [WORKSPACE_METADATA, WORKSPACE_SPRITESHEET]);
    const binaryFiles = [...paths].filter(([file]) => !file.isFolder && file.text.startsWith('data:')).map(([, name]) => name);
    binaryFiles.push(...[...extraFiles.keys()].map(projectPath).filter(name => !binaryFiles.includes(name)));
    if (workspace.spritesheetBase64) {
        zip.file(WORKSPACE_SPRITESHEET, Uint8Array.from(atob(workspace.spritesheetBase64), character => character.charCodeAt(0)));
    }
    zip.file(WORKSPACE_METADATA, JSON.stringify({ version: 1, settings: workspace.settings ?? { language: 'Java' }, binaryFiles }, null, 2) + '\n');
    return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

export async function importProjectZip(input: ArrayBuffer | Uint8Array, name = 'Scratch project'):
    Promise<{ workspace: ExportedWorkspace, warnings: string[] }> {
    const zip = await JSZip.loadAsync(input);
    for (const entry of Object.values(zip.files)) {
        const path = (entry as any).unsafeOriginalName || entry.name;
        projectPath(entry.dir ? path.replace(/\/$/, '') : path);
    }
    const files = Object.values(zip.files).filter(file => !file.dir && !file.name.startsWith('__MACOSX/'));
    if (!files.length || files.length > 2000) throw new Error('Project archive is empty or has more than 2,000 files');
    for (const file of files) projectPath((file as any).unsafeOriginalName || file.name);
    const prefix = files[0].name.split('/')[0] + '/';
    const strip = files.every(file => file.name.startsWith(prefix)) && prefix !== '.scratch4j/' && prefix !== '.online-ide/';
    let total = 0;
    const decoded: { name: string, bytes: Uint8Array }[] = [];
    const names = new Set<string>();
    for (const file of files) {
        const path = projectPath(strip ? file.name.slice(prefix.length) : file.name);
        if (names.has(path.toLowerCase())) throw new Error(`Conflicting project filename: ${path}`);
        names.add(path.toLowerCase());
        const size = (file as any)._data?.uncompressedSize;
        if (size > MAX_FILE || total + size > MAX_TOTAL) throw new Error(`Project asset limit exceeded: ${path}`);
        const bytes = await file.async('uint8array');
        if (crc32(bytes) !== (file as any)._data.crc32) throw new Error(`Corrupt project file: ${path}`);
        total += bytes.length;
        if (bytes.length > MAX_FILE || total > MAX_TOTAL) throw new Error(`Project asset limit exceeded: ${path}`);
        decoded.push({ name: path, bytes });
    }
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const workspaceFile = decoded.find(file => file.name === WORKSPACE_METADATA);
    if (workspaceFile) return importWorkspaceZip(zip, decoded, JSON.parse(decoder.decode(workspaceFile.bytes)), strip ? prefix.slice(0, -1) : name, strip, prefix);
    const metadataFile = decoded.find(file => file.name === METADATA);
    const metadata: any = metadataFile ? JSON.parse(decoder.decode(metadataFile.bytes)) : { version: 1, flavour: 'standard' };
    const warnings = metadataWarnings(metadata);
    const modules: ExportedFile[] = [];
    const dependencies = new Set<string>(metadata.externalDependencies ?? []);
    for (const file of decoded) {
        if (file.name === METADATA) continue;
        if (/^(\.git|\.vscode|target|build|export|out)\//.test(file.name)
            || /^\.scratch4j\/(build|history|trash)\//.test(file.name)) continue;
        if (/\.jar$/i.test(file.name)) { dependencies.add(file.name); continue; }
        modules.push({ name: file.name, text: TEXT.test(file.name) && !metadata.desktopFiles?.includes(file.name)
            ? decoder.decode(file.bytes) : dataUrl(file.bytes, file.name),
            id: modules.length + 1, isFolder: false, identical_to_repository_version: true });
    }
    if (!modules.some(file => /\.java$/i.test(file.name))) throw new Error('Project archive contains no Java source files');
    if (dependencies.size) {
        metadata.externalDependencies = [...dependencies];
        warnings.push(`Browser cannot load JAR dependencies: ${[...dependencies].join(', ')}. Keep them for Studio.`);
    }
    if (metadata.fullScreen || metadata.splashLogo) warnings.push('Desktop fullscreen and splash settings are retained for Studio. The browser uses its output panel.');
    if (!modules.some(file => /\bvoid\s+main\s*\(/.test(file.text)) && metadata.startStage) {
        if (!/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(metadata.startStage)) throw new Error('Invalid project start class');
        let filename = 'ScratchProjectStart.java';
        for (let suffix = 2; modules.some(file => file.name === filename); suffix++) filename = `ScratchProjectStart${suffix}.java`;
        let source = 'void main() {\n';
        if (metadata.pixelArt) source += '    Window.useTextureSampling(TextureSampling.POINT);\n';
        source += `    new ${metadata.startStage}();\n`;
        if (metadata.debugOnStart) source += '    Window.getInstance().setDebug(true);\n';
        source += '}\n';
        modules.push({ name: filename, text: source, id: modules.length + 1, isFolder: false, identical_to_repository_version: true });
        metadata.startFile = filename;
    }
    const tree = folderTree(zip, modules, strip, prefix, ['.scratch4j']);
    return { workspace: { name: strip ? prefix.slice(0, -1) : name, id: 0, modules: tree,
        settings: { language: 'Java', libraries: metadata.flavour === 'nrw' ? ['scratch', 'nrw'] : ['scratch'], scratchProject: metadata } }, warnings };
}

/** Rebuilds folder IDs so the file explorer and subsequent exports retain the tree. */
function folderTree(zip: JSZip, modules: ExportedFile[], strip: boolean, prefix: string, ownDirectories: string[]): ExportedFile[] {
    const tree: ExportedFile[] = [];
    const folders = new Map<string, ExportedFile>();
    function folder(path: string): ExportedFile | undefined {
        if (!path) return undefined;
        const existing = folders.get(path);
        if (existing) return existing;
        const parts = path.split('/');
        const name = parts.pop()!;
        const parent = folder(parts.join('/'));
        const entry: ExportedFile = { name, text: '', id: tree.length + 1, isFolder: true,
            parent_folder_id: parent?.id, identical_to_repository_version: true };
        folders.set(path, entry);
        tree.push(entry);
        return entry;
    }
    for (const entry of Object.values(zip.files).filter(file => file.dir)) {
        const path = (strip ? entry.name.slice(prefix.length) : entry.name).replace(/\/$/, '');
        if (path && !ownDirectories.includes(path) && !/^(\.git|\.vscode|target|build|export|out|__MACOSX)(\/|$)/.test(path)
            && !/^\.scratch4j\/(build|history|trash)(\/|$)/.test(path)) folder(path);
    }
    for (const file of modules) {
        const parts = file.name.split('/');
        const name = parts.pop()!;
        const parent = folder(parts.join('/'));
        tree.push({ ...file, name, id: tree.length + 1, parent_folder_id: parent?.id });
    }
    return tree;
}

/** The way back for exportWorkspaceZip: settings, binary files and spritesheet as they were. */
function importWorkspaceZip(zip: JSZip, decoded: { name: string, bytes: Uint8Array }[], metadata: any, name: string, strip: boolean, prefix: string):
    { workspace: ExportedWorkspace, warnings: string[] } {
    if (!metadata || typeof metadata !== 'object' || metadata.version !== 1 || typeof metadata.settings?.language !== 'string') {
        throw new Error('Invalid workspace metadata');
    }
    const binary = new Set<string>(Array.isArray(metadata.binaryFiles) ? metadata.binaryFiles : []);
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const modules: ExportedFile[] = [];
    let spritesheetBase64: string | undefined;
    for (const file of decoded) {
        if (file.name === WORKSPACE_METADATA) continue;
        if (file.name === WORKSPACE_SPRITESHEET) { spritesheetBase64 = dataUrl(file.bytes, 'x.zip').split(',')[1]; continue; }
        if (/^(\.git|\.vscode)\//.test(file.name)) continue;
        modules.push({ name: file.name, text: binary.has(file.name) ? dataUrl(file.bytes, file.name) : decoder.decode(file.bytes),
            id: modules.length + 1, isFolder: false, identical_to_repository_version: true });
    }
    const workspace: ExportedWorkspace = { name, id: 0, modules: folderTree(zip, modules, strip, prefix, ['.online-ide']),
        settings: metadata.settings };
    if (spritesheetBase64) workspace.spritesheetBase64 = spritesheetBase64;
    return { workspace, warnings: [] };
}
