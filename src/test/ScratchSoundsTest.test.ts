import { beforeEach, expect, test, vi } from 'vitest';

const audio = vi.hoisted(() => ({ instances: [] as any[], nextId: 0 }));

vi.mock('howler', () => ({
    Howler: { ctx: { state: 'running' } },
    Howl: class {
        listeners: { event: string, callback: () => void, id?: number }[] = [];
        playingIds = new Set<number>();
        options: any;
        play = vi.fn((sprite?: string) => {
            // Howler's argument-free play() resumes a sole pending/paused sound.
            // Shared groups must request a fresh playback while loading instead.
            if (sprite === undefined && this.playingIds.size === 1) {
                return [...this.playingIds][0];
            }
            const id = ++audio.nextId;
            this.playingIds.add(id);
            return id;
        });
        volume = vi.fn();
        stop = vi.fn((id?: number) => {
            const ids = id === undefined ? [...this.playingIds] : [id];
            for (const stopped of ids) this.emit('stop', stopped);
        });
        once = vi.fn((event: string, callback: () => void, id?: number) => {
            this.listeners.push({ event, callback, id });
        });
        off = vi.fn((event: string, callback: () => void, id?: number) => {
            this.listeners = this.listeners.filter(listener =>
                listener.event !== event || listener.callback !== callback || listener.id !== id);
        });
        constructor(options: any) {
            this.options = options;
            audio.instances.push(this);
        }
        emit(event: string, id?: number) {
            if (id !== undefined) this.playingIds.delete(id);
            for (const listener of [...this.listeners]) {
                if (listener.event === event && (listener.id === undefined || listener.id === id)) {
                    listener.callback();
                }
            }
        }
    },
}));

let ScratchSound: typeof import('../compiler/java/runtime/graphics/scratch/ScratchSounds').ScratchSound;
let ScratchSoundBank: typeof import('../compiler/java/runtime/graphics/scratch/ScratchSounds').ScratchSoundBank;

beforeEach(async () => {
    vi.resetModules();
    audio.instances.length = 0;
    audio.nextId = 0;
    ({ ScratchSound, ScratchSoundBank } = await import('../compiler/java/runtime/graphics/scratch/ScratchSounds'));
});

test('adding, adjusting volume and cloning unplayed sounds allocates no Howler groups', () => {
    for (let round = 0; round < 100; round++) {
        const bank = new ScratchSoundBank();
        bank.add('effect', 'assets/effect.wav');
        bank.setVolume(30);
        const clone = bank.copy();
        expect(clone.getVolume()).toBe(30);
        expect(clone.isPlaying('effect')).toBe(false);
        clone.stopAll();
    }
    expect(audio.instances).toHaveLength(0);
});

test('recreating stages reuses one Howler group per file and releases playback listeners', () => {
    for (let round = 0; round < 6; round++) {
        const bank = new ScratchSoundBank();
        for (let file = 0; file < 30; file++) {
            bank.add(`effect${file}`, `assets/effect${file}.wav`);
            bank.play(`effect${file}`);
        }
        bank.stopAll();
    }
    expect(audio.instances).toHaveLength(30);
    expect(audio.instances.every(howl => howl.listeners.length === 0)).toBe(true);
    expect(audio.instances.every(howl => howl.playingIds.size === 0)).toBe(true);
});

test('shared resources preserve independent overlapping playback, volume and stop', () => {
    const first = new ScratchSoundBank();
    first.add('effect', 'assets/effect.wav');
    first.setVolume(30);
    const second = first.copy();
    second.setVolume(80);
    first.play('effect');
    first.play('effect');
    second.play('effect');
    expect(audio.instances).toHaveLength(1);
    const howl = audio.instances[0];
    expect(howl.play).toHaveBeenCalledTimes(2);
    expect(howl.volume).toHaveBeenCalledWith(0.3, 1);
    expect(howl.volume).toHaveBeenCalledWith(0.8, 2);

    first.stopAll();
    expect(howl.stop).toHaveBeenLastCalledWith(1);
    expect(first.isPlaying('effect')).toBe(false);
    expect(second.isPlaying('effect')).toBe(true);
    second.setVolume(50);
    expect(howl.volume).toHaveBeenLastCalledWith(0.5, 2);
    second.stopAll();
    expect(howl.listeners).toHaveLength(0);
});

test('queued playback counts as playing and ends independently', () => {
    const first = new ScratchSound('first', '/effect.wav');
    const second = first.copy();
    first.play();
    second.play();
    first.play();
    const howl = audio.instances[0];
    expect(howl.play).toHaveBeenCalledTimes(2);
    expect(first.isPlaying()).toBe(true);
    howl.emit('end', 1);
    expect(first.isPlaying()).toBe(false);
    expect(second.isPlaying()).toBe(true);
    first.play();
    expect(howl.play).toHaveBeenCalledTimes(3);
    first.stop();
    second.stop();
    expect(howl.listeners).toHaveLength(0);
});

test('playback and loading errors clear playing state and detach listeners', () => {
    const sound = new ScratchSound('effect', '/effect.wav');
    sound.play();
    const howl = audio.instances[0];
    howl.emit('playerror', 1);
    expect(sound.isPlaying()).toBe(false);
    expect(howl.listeners).toHaveLength(0);
    sound.play();
    howl.emit('loaderror');
    expect(sound.isPlaying()).toBe(false);
    expect(howl.listeners).toHaveLength(0);
});

test('format hints are retained and do not share incompatible groups', () => {
    new ScratchSound('wav', 'data:audio;base64,AAAA', 'wav').play();
    new ScratchSound('ogg', 'data:audio;base64,AAAA', 'ogg').play();
    expect(audio.instances).toHaveLength(2);
    expect(audio.instances[0].options.format).toEqual(['wav']);
    expect(audio.instances[1].options.format).toEqual(['ogg']);
});
