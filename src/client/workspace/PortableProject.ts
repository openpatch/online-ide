import JSZip from 'jszip';
import type { ExportedWorkspace, ExportedFile } from './WorkspaceImporterExporter';
import { scratchDesktopVersion, scratchBrowserMembers } from '../../compiler/java/runtime/graphics/scratch/ScratchCompatibility';
const contract = { desktopVersion: scratchDesktopVersion, members: scratchBrowserMembers };

const METADATA = '.scratch4j/project.json';
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

export async function exportProjectZip(workspace: ExportedWorkspace): Promise<Uint8Array> {
    if (workspace.settings?.language !== 'Java' || !workspace.settings.libraries?.includes('scratch')) throw new Error('Choose a Java workspace with the Scratch library first.');
    if (workspace.spritesheetBase64) throw new Error('Extract the legacy spritesheet into image files before exporting a portable project. Workspace JSON still preserves it.');
    const extraLibraries = workspace.settings.libraries.filter(id => !['scratch', 'nrw'].includes(id));
    if (extraLibraries.length) throw new Error(`These browser libraries have no portable adapter: ${extraLibraries.join(', ')}`);
    const paths = workspacePaths(workspace);
    const metadata: any = { version: 1, portableVersion: 1, libraryVersion: contract.desktopVersion,
        browserFeatures: [], externalDependencies: [], ...workspace.settings.scratchProject,
        flavour: workspace.settings.libraries.includes('nrw') ? 'nrw' : 'standard', sourceEnvironment: 'browser' };
    const entry = workspace.modules.find(file => !file.isFolder && /\bvoid\s+main\s*\(/.test(file.text));
    if (!metadata.startFile && entry) metadata.startFile = paths.get(entry);
    if (!metadata.startStage && entry) metadata.startStage = entry.name.replace(/\.java$/i, '').split('/').pop();
    metadataWarnings(metadata);
    const zip = new JSZip();
    let total = 0;
    if (paths.size > 2000) throw new Error('Project has more than 2,000 files');
    for (const [file, name] of paths) {
        if (file.isFolder) { zip.folder(name); continue; }
        if (name === METADATA) continue;
        const bytes = bytesOf(file.text);
        total += bytes.length;
        if (bytes.length > MAX_FILE || total > MAX_TOTAL) throw new Error(`Project asset limit exceeded: ${name}`);
        zip.file(name, bytes);
    }
    zip.file(METADATA, JSON.stringify(metadata, null, 2) + '\n');
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
    const strip = files.every(file => file.name.startsWith(prefix)) && prefix !== '.scratch4j/';
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
    // Rebuild folder IDs so the file explorer and subsequent exports retain the tree.
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
        if (path && path !== '.scratch4j' && !/^(\.git|\.vscode|target|build|export|out|__MACOSX)(\/|$)/.test(path)
            && !/^\.scratch4j\/(build|history|trash)(\/|$)/.test(path)) folder(path);
    }
    for (const file of modules) {
        const parts = file.name.split('/');
        const name = parts.pop()!;
        const parent = folder(parts.join('/'));
        tree.push({ ...file, name, id: tree.length + 1, parent_folder_id: parent?.id });
    }
    return { workspace: { name: strip ? prefix.slice(0, -1) : name, id: 0, modules: tree,
        settings: { language: 'Java', libraries: metadata.flavour === 'nrw' ? ['scratch', 'nrw'] : ['scratch'], scratchProject: metadata } }, warnings };
}
