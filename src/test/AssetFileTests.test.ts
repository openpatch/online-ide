import { describe, expect, test } from "vitest";
import { decodeShaderSource, isAssetFile, resolveWorkspaceAssetUrl } from "../client/workspace/AssetFile";

function makeFile(name: string, text: string, parent_folder_id: number | null = null, isFolder = false) {
    return { name, parent_folder_id, isFolder, getText: () => text };
}

describe("workspace assets", () => {
    test("resolves root assets with and without a leading slash", () => {
        const asset = makeFile("sky.jpg", "data:image/jpeg;base64,aGVsbG8=");
        const workspace = {
            getFiles: () => [asset],
            getPath: () => []
        };

        expect(resolveWorkspaceAssetUrl(workspace as any, "sky.jpg")).toBe(asset.getText());
        expect(resolveWorkspaceAssetUrl(workspace as any, "/sky.jpg")).toBe(asset.getText());
    });

    test("resolves assets by their project-relative folder path", () => {
        const asset = makeFile("sky.png", "data:image/png;base64,aGVsbG8=", 10);
        const workspace = {
            getFiles: () => [asset],
            getPath: () => ["images"]
        };

        expect(resolveWorkspaceAssetUrl(workspace as any, "images/sky.png")).toBe(asset.getText());
    });

    test("leaves an ordinary URL untouched when no internal asset matches", () => {
        const url = "https://example.com/sky.jpg";
        const workspace = { getFiles: () => [], getPath: () => [] };

        expect(resolveWorkspaceAssetUrl(workspace as any, url)).toBe(url);
    });

    test("does not mistake normal source files for assets", () => {
        expect(isAssetFile(makeFile("Main.java", "class Main {}") as any)).toBe(false);
    });

    test("decodes uploaded Tiled maps and tilesets like shader sources", () => {
        const map = '<map orientation="orthogonal"/>';
        const dataUrl = "data:application/xml;base64," + btoa(unescape(encodeURIComponent(map)));
        expect(decodeShaderSource("level.tmx", dataUrl)).toBe(map);
        expect(decodeShaderSource("assets/tiles.tsx", dataUrl)).toBe(map);
        // A file the browser cannot treat as text stays a download/preview asset.
        expect(decodeShaderSource("sprites.png", dataUrl)).toBe(dataUrl);
        expect(decodeShaderSource("level.json", dataUrl)).toBe(dataUrl);
        expect(decodeShaderSource("level.tmx", map)).toBe(map);
    });
});
