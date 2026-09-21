import type { CompilerFile } from "../../compiler/common/module/CompilerFile";
import type { Workspace } from "./Workspace";

const DATA_URL_PREFIX = "data:";

export function isAssetDataUrl(text: string): boolean {
    return text.startsWith(DATA_URL_PREFIX);
}

export function isAssetFile(file: CompilerFile): boolean {
    return isAssetDataUrl(file.getText());
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
