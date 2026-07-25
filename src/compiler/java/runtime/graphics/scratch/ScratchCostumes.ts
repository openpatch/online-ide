import * as PIXI from "pixi.js";

// Kenney atlases imported by src/development/scratchAssetsGenerator.js.
// Both JSON descriptor and PNG are imported as hashed asset URLs (loaded on demand);
// the descriptor is fetched + parsed at runtime, matching the main spritesheet.
import platformerJson from "/assets/graphics/scratch/platformer.json.txt";
import platformerPng from "/assets/graphics/scratch/platformer.png";
import jumperJson from "/assets/graphics/scratch/jumper.json.txt";
import jumperPng from "/assets/graphics/scratch/jumper.png";
import spaceShooterJson from "/assets/graphics/scratch/space_shooter.json.txt";
import spaceShooterPng from "/assets/graphics/scratch/space_shooter.png";
import tappyPlaneJson from "/assets/graphics/scratch/tappy_plane.json.txt";
import tappyPlanePng from "/assets/graphics/scratch/tappy_plane.png";

type SheetDef = { name: string; json: string; png: string };

// Resolution order: a bare costume name resolves to the FIRST sheet defining it.
const SHEET_DEFS: SheetDef[] = [
    { name: "platformer", json: platformerJson, png: platformerPng },
    { name: "jumper", json: jumperJson, png: jumperPng },
    { name: "space_shooter", json: spaceShooterJson, png: spaceShooterPng },
    { name: "tappy_plane", json: tappyPlaneJson, png: tappyPlanePng },
];

/**
 * Registry of the built-in kenney.nl costumes bundled with the Scratch library.
 * Loaded once (lazily) the first time a Stage is created. Lookup is case-insensitive
 * by bare name (`"bunny1_stand"`) across the sheets in order, or sheet-qualified
 * (`"jumper/spring"`) to disambiguate names that appear in more than one sheet.
 */
export class ScratchCostumes {
    private static sheets: Map<string, PIXI.Spritesheet> = new Map();
    // lower-cased bare name -> sheet name (first sheet that defines it)
    private static bareNameToSheet: Map<string, string> = new Map();
    private static loadPromise: Promise<void> | undefined;

    static load(): Promise<void> {
        if (this.loadPromise) return this.loadPromise;
        this.loadPromise = (async () => {
            for (const def of SHEET_DEFS) {
                try {
                    const data: any = await fetch(def.json).then(r => r.json());
                    const texture: PIXI.Texture = await PIXI.Assets.load(def.png);
                    texture.source.minFilter = "linear";
                    texture.source.magFilter = "linear";
                    data.meta = { ...data.meta, size: { w: texture.width, h: texture.height } };
                    const sheet = new PIXI.Spritesheet(texture, data);
                    await sheet.parse();
                    this.sheets.set(def.name, sheet);
                    for (const frameName of Object.keys(data.frames)) {
                        const key = frameName.toLowerCase();
                        if (!this.bareNameToSheet.has(key)) this.bareNameToSheet.set(key, def.name);
                    }
                } catch (e) {
                    // A missing sheet must not break the whole library.
                    console.warn(`Scratch: could not load costume sheet '${def.name}'`, e);
                }
            }
        })();
        return this.loadPromise;
    }

    /** Resolve a costume name to a texture, or undefined if unknown. */
    static getTexture(name: string): PIXI.Texture | undefined {
        // strip an optional .png suffix students might copy from the atlas
        name = name.replace(/\.png$/i, "");

        const slash = name.indexOf("/");
        if (slash >= 0) {
            const sheetName = name.substring(0, slash);
            const frame = name.substring(slash + 1);
            return this.textureFromSheet(sheetName, frame);
        }

        const sheetName = this.bareNameToSheet.get(name.toLowerCase());
        if (!sheetName) return undefined;
        return this.textureFromSheet(sheetName, name);
    }

    static has(name: string): boolean {
        return this.getTexture(name) !== undefined;
    }

    private static textureFromSheet(sheetName: string, frame: string): PIXI.Texture | undefined {
        const sheet = this.sheets.get(sheetName.toLowerCase());
        if (!sheet) return undefined;
        // spritesheet.textures is keyed by the exact frame name; match case-insensitively
        const direct = sheet.textures[frame];
        if (direct) return direct;
        const key = Object.keys(sheet.textures).find(k => k.toLowerCase() === frame.toLowerCase());
        return key ? sheet.textures[key] : undefined;
    }
}
