import { Howl, Howler } from "howler";

/**
 * The OGG files copied by src/development/scratchAssetsGenerator.js, imported as
 * URLs — the same treatment the costume atlases get, so Vite hashes them, emits
 * them and rewrites every URL relative to this module. That is what makes the
 * embedded build work from a subdirectory (a Hyperbook serves it below
 * /__hyperbook_assets/), where a path from the site root would 404.
 *
 * Only the URLs are eager, not the audio: the files are fetched when a sound is
 * first played. `assetsInlineLimit` in vite.config-common.ts keeps them out of
 * the bundle — two thirds are small enough that they would otherwise be inlined
 * as 1.3 MB of base64.
 */
const SOUND_URLS = import.meta.glob<string>("/assets/sounds/scratch/*.ogg", {
    query: "?url",
    import: "default",
    eager: true,
});

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
 * The 266 names come from the imports above, so the registry needs no manifest
 * and no loading step; the OGG files themselves are only fetched when a sound is
 * first played. Lookup is case-insensitive by bare name (`"handleCoins"`), with
 * an optional `.ogg` suffix students might copy from the sound list.
 */
export class ScratchSounds {
    /** lower-cased bare name -> asset URL */
    private static urls: Map<string, string> = new Map();
    /** lower-cased bare name -> exact name as shipped, for error messages */
    private static names: Map<string, string> = new Map();

    static {
        for (const [path, url] of Object.entries(SOUND_URLS)) {
            const name = path.substring(path.lastIndexOf("/") + 1).replace(/\.ogg$/i, "");
            this.urls.set(name.toLowerCase(), url);
            this.names.set(name.toLowerCase(), name);
        }
    }

    static has(name: string): boolean {
        return this.urls.has(name.replace(/\.ogg$/i, "").toLowerCase());
    }

    /**
     * Resolve a built-in sound name or a user path/URL to a playable URL.
     * Built-in names win; anything containing a slash or a file extension other
     * than a known built-in is treated as a path relative to the site root.
     */
    static resolveUrl(nameOrPath: string): string | undefined {
        const bare = nameOrPath.replace(/\.ogg$/i, "");
        const url = this.urls.get(bare.toLowerCase());
        if (url) return url;
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
