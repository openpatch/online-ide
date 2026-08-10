/**
 * Imports the kenney.nl assets bundled by org.openpatch.scratch (Scratch for Java)
 * into the online-ide so the `scratch` library can offer costumes/sounds "with no
 * files needed", exactly like the desktop library.
 *
 *  - image atlases (Starling TextureAtlas XML) -> PIXI spritesheet JSON + copied PNG
 *    into assets/graphics/scratch/
 *  - OGG sounds -> flattened into assets/sounds/scratch/
 *  - UbuntuMono-Regular.ttf -> assets/fonts/
 *
 * Everything goes to assets/ rather than public/, so Vite hashes and rewrites the
 * URLs and the embedded build also works when it is included from a subdirectory.
 *
 * Run: node src/development/scratchAssetsGenerator.js [pathToScratchForJavaResources]
 * Default source: ../scratch-for-java/src/main/resources
 */
import * as fs from "fs";
import * as path from "path";

const SRC = process.argv[2] || "../scratch-for-java/src/main/resources";
const OUT_IMG = "./assets/graphics/scratch";
const OUT_FONT = "./assets/fonts";
const OUT_SOUNDS = "./assets/sounds/scratch";

// Sheets in resolution order: a bare costume name resolves to the FIRST sheet that
// defines it; duplicated names can be disambiguated as "sheet/name".
const SHEETS = ["platformer", "jumper", "space_shooter", "tappy_plane"];

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function parseAtlas(xml) {
    // <SubTexture name="x.png" x="0" y="0" width="1" height="1"/>
    const frames = {};
    const re = /<SubTexture\s+name="([^"]+)"\s+x="(-?\d+)"\s+y="(-?\d+)"\s+width="(\d+)"\s+height="(\d+)"\s*\/>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
        const rawName = m[1];
        const name = rawName.replace(/\.png$/i, "");
        const x = parseInt(m[2], 10), y = parseInt(m[3], 10);
        const w = parseInt(m[4], 10), h = parseInt(m[5], 10);
        frames[name] = {
            frame: { x, y, w, h },
            rotated: false,
            trimmed: false,
            spriteSourceSize: { x: 0, y: 0, w, h },
            sourceSize: { w, h },
            pivot: { x: 0.5, y: 0.5 },
        };
    }
    return frames;
}

function generateImages() {
    ensureDir(OUT_IMG);
    const manifest = [];
    for (const sheet of SHEETS) {
        const xmlPath = path.join(SRC, "images", sheet + ".xml");
        const pngPath = path.join(SRC, "images", sheet + ".png");
        if (!fs.existsSync(xmlPath) || !fs.existsSync(pngPath)) {
            console.log(`  (skip ${sheet}: not present)`);
            continue;
        }
        const frames = parseAtlas(fs.readFileSync(xmlPath, "utf-8"));
        const data = {
            frames,
            meta: {
                app: "scratchAssetsGenerator",
                version: "1.0",
                image: sheet + ".png",
                format: "RGBA8888",
                scale: "1",
            },
        };
        // ".json.txt" so Vite imports it as a URL string (see spritesheet.json.txt);
        // fetched + parsed at runtime by ScratchCostumes.
        fs.writeFileSync(path.join(OUT_IMG, sheet + ".json.txt"), JSON.stringify(data), "utf-8");
        fs.copyFileSync(pngPath, path.join(OUT_IMG, sheet + ".png"));
        manifest.push(sheet);
        console.log(`  ${sheet}: ${Object.keys(frames).length} costumes`);
    }
    fs.writeFileSync(path.join(OUT_IMG, "sheets.json"), JSON.stringify(manifest), "utf-8");
    return manifest;
}

function walkFiles(dir, ext) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walkFiles(full, ext));
        else if (entry.name.toLowerCase().endsWith(ext)) out.push(full);
    }
    return out;
}

function generateSounds() {
    ensureDir(OUT_SOUNDS);
    const files = walkFiles(path.join(SRC, "sounds"), ".ogg");
    const names = [];
    const seen = new Set();
    for (const file of files) {
        const base = path.basename(file, ".ogg");
        if (seen.has(base.toLowerCase())) {
            console.log(`  (dup sound name skipped: ${base})`);
            continue;
        }
        seen.add(base.toLowerCase());
        fs.copyFileSync(file, path.join(OUT_SOUNDS, base + ".ogg"));
        names.push(base);
    }
    // No manifest: ScratchSounds gets the names from an import.meta.glob of this
    // directory, so the file names in it are the single source of truth.
    console.log(`  ${names.length} sounds`);
    return names;
}

function generateFont() {
    ensureDir(OUT_FONT);
    const ttf = path.join(SRC, "UbuntuMono-Regular.ttf");
    if (fs.existsSync(ttf)) {
        fs.copyFileSync(ttf, path.join(OUT_FONT, "UbuntuMono-Regular.ttf"));
        console.log("  UbuntuMono-Regular.ttf copied");
    } else {
        console.log("  (font not present)");
    }
}

console.log("Scratch assets: images");
generateImages();
console.log("Scratch assets: sounds");
generateSounds();
console.log("Scratch assets: font");
generateFont();
console.log("[1;32mDone![0m");
