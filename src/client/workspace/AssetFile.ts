import type { CompilerFile } from "../../compiler/common/module/CompilerFile";
import type { Workspace } from "./Workspace";

const DATA_URL_PREFIX = "data:";

export function isAssetDataUrl(text: string): boolean {
    return text.startsWith(DATA_URL_PREFIX);
}

export function isAssetFile(file: CompilerFile): boolean {
    return isAssetDataUrl(file.getText());
}

/** Embedded pages and saved workspaces may supply text resources - shader
 * sources and Tiled maps among them - as assets. */
export function decodeShaderSource(filename: string, text: string): string {
    if (!/\.(frag|vert|glsl|tmx|tsx)$/i.test(filename) || !isAssetDataUrl(text)) return text;
    return decodeTextAsset(text);
}

/** Text resources such as shaders and Tiled XML may arrive as embedded assets. */
export function decodeTextAsset(text: string): string {
    if (!isAssetDataUrl(text)) return text;

    const comma = text.indexOf(",");
    const header = text.substring(0, comma);
    const body = text.substring(comma + 1);
    if (!/;base64$/i.test(header)) return decodeURIComponent(body);
    const bytes = Uint8Array.from(atob(body), character => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

export function readBrowserFileAsDataUrl(file: File): Promise<string> {
    return readBlobAsDataUrl(file);
}

export function readBlobAsDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error("Could not read asset data"));
        reader.readAsDataURL(blob);
    });
}

/**
 * Resolve a project-relative asset name before a caller tries the value as an
 * ordinary URL. A leading slash is accepted for convenience, but is not
 * required ("sky.jpg" and "/sky.jpg" both address a root-level asset).
 */
export function resolveWorkspaceAssetUrl(workspace: Workspace | undefined, requestedUrl: string): string {
    if (!workspace || !requestedUrl) return requestedUrl;

    const normalizedUrl = requestedUrl.replace(/^\.\//, "").replace(/^\/+/, "");
    const file = workspace.getFiles().find(candidate => {
        if (candidate.isFolder || !isAssetFile(candidate)) return false;
        const path = [...workspace.getPath(candidate), candidate.name].join("/");
        return path === normalizedUrl;
    });

    return file?.getText() ?? requestedUrl;
}
