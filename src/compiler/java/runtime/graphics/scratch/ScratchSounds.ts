import { Howl, Howler } from "howler";

/** Public URL of the OGG files copied by src/development/scratchAssetsGenerator.js. */
const SOUND_BASE = "/assets/scratch/sounds/";

/**
 * One playable sound instance, mirroring org.openpatch.scratch.internal.Sound.
 * Every sprite owns its own instances, so ten sprites playing the same sound are
 * heard ten times at once — but a single instance only plays once at a time.
 */
export class ScratchSound {
    private howl?: any;
    private soundId?: number;

    constructor(public name: string, private url: string) { }

    private getHowl(): any {
        if (!this.howl) {
            this.howl = new Howl({ src: [this.url], preload: true, html5: false });
        }
        return this.howl;
    }

    play() {
        if (this.isPlaying()) return;
        // Chrome starts the Web Audio context suspended and Howler's auto-unlock does
        // not always fire for canvas interaction. playSound() is virtually always
        // reached from a key/mouse handler, so resuming here is a valid user gesture.
        const ctx = (Howler as any)?.ctx;
        if (ctx && ctx.state === "suspended") ctx.resume();
        this.soundId = this.getHowl().play();
    }

    stop() {
        if (this.howl) this.howl.stop();
        this.soundId = undefined;
    }

    isPlaying(): boolean {
        if (!this.howl || this.soundId === undefined) return false;
        return this.howl.playing(this.soundId);
    }

    setVolume(percent: number) {
        this.getHowl().volume(Math.max(0, Math.min(1, percent / 100)));
    }
}

/**
 * Registry of the built-in kenney.nl sounds bundled with the Scratch library.
 * The OGG files live in `public/` and are fetched by URL on first playback, so
 * nothing is bundled into the IDE build. The manifest (267 names) is loaded once,
 * lazily, alongside the costume atlases.
 */
export class ScratchSounds {
    /** lower-cased name -> exact name as shipped */
    private static names: Map<string, string> = new Map();
    private static loadPromise: Promise<void> | undefined;

    static load(): Promise<void> {
        if (this.loadPromise) return this.loadPromise;
        this.loadPromise = (async () => {
            try {
                const list: string[] = await fetch(SOUND_BASE + "sounds.json").then(r => r.json());
                for (const n of list) this.names.set(n.toLowerCase(), n);
            } catch (e) {
                // A missing manifest must not break the whole library.
                console.warn("Scratch: could not load the built-in sound manifest", e);
            }
        })();
        return this.loadPromise;
    }

    static has(name: string): boolean {
        return this.names.has(name.replace(/\.ogg$/i, "").toLowerCase());
    }

    /**
     * Resolve a built-in sound name or a user path/URL to a playable URL.
     * Built-in names win; anything containing a slash or a file extension other
     * than a known built-in is treated as a path relative to the site root.
     */
    static resolveUrl(nameOrPath: string): string | undefined {
        const bare = nameOrPath.replace(/\.ogg$/i, "");
        const exact = this.names.get(bare.toLowerCase());
        if (exact) return SOUND_BASE + exact + ".ogg";
        if (/^(https?:)?\/\//.test(nameOrPath) || nameOrPath.indexOf("/") >= 0 || /\.[a-z0-9]{2,4}$/i.test(nameOrPath)) {
            return nameOrPath;
        }
        return undefined;
    }

    static create(name: string, nameOrPath: string): ScratchSound | undefined {
        const url = this.resolveUrl(nameOrPath);
        return url ? new ScratchSound(name, url) : undefined;
    }

    /** Comma-separated sample of known names, for error messages. */
    static sampleNames(count: number = 5): string {
        return Array.from(this.names.values()).slice(0, count).join(", ");
    }
}

/**
 * Sound bank shared by Stage and Sprite — both expose the identical
 * addSound/playSound/stopSound/stopAllSounds/isSoundPlaying API.
 */
export class ScratchSoundBank {
    private sounds: ScratchSound[] = [];
    private volume: number = 100;

    add(name: string, path: string) {
        if (this.sounds.some(s => s.name === name)) return;
        const sound = ScratchSounds.create(name, path);
        if (!sound) {
            console.warn(`Scratch: unknown sound '${path}'. Known sounds include: ${ScratchSounds.sampleNames()} …`);
            return;
        }
        sound.setVolume(this.volume);
        this.sounds.push(sound);
    }

    private find(name: string): ScratchSound | undefined {
        return this.sounds.find(s => s.name === name);
    }

    play(name: string) {
        const sound = this.find(name);
        if (!sound) {
            const available = this.sounds.length ? this.sounds.map(s => `'${s.name}'`).join(", ") : "none added";
            console.warn(`Scratch: sound '${name}' not found. Available sounds: ${available}`);
            return;
        }
        sound.play();
    }

    stop(name: string) { this.find(name)?.stop(); }
    stopAll() { for (const s of this.sounds) s.stop(); }
    isPlaying(name: string): boolean { return this.find(name)?.isPlaying() ?? false; }

    setVolume(percent: number) {
        this.volume = Math.max(0, Math.min(100, percent));
        for (const s of this.sounds) s.setVolume(this.volume);
    }
    getVolume(): number { return this.volume; }
}
