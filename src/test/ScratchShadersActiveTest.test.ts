import { afterEach, expect, test, vi } from 'vitest';
import '../compiler/common/interpreter/Interpreter';
import '../compiler/java/JavaCompiler';
import { ScratchShaderClass, ScratchShadersClass } from '../compiler/java/runtime/graphics/scratch/ScratchShaders';
import { Thread } from '../compiler/common/interpreter/Thread';
import { ThreadState } from '../compiler/common/interpreter/ThreadState';

// Which shaders a stage draws with, as upstream's Shaders: loading is
// replaced by a stand-in filter named after the shader.
afterEach(() => vi.restoreAllMocks());

async function threeShaders(onChange: (filters: any[]) => void): Promise<ScratchShadersClass> {
    vi.spyOn(ScratchShaderClass.prototype, 'load').mockImplementation(async function (this: ScratchShaderClass) {
        this.filter = { shader: this.name } as any;
    });
    const shaders = ScratchShadersClass.of('stage', onChange);
    for (const name of ['tint', 'waves', 'blur']) {
        const callback = vi.fn();
        const thread = { state: ThreadState.running, s: [], throwRuntimeExceptionOnLastExecutedStep: vi.fn() };
        shaders._mj$add$Shader$string$string$string(thread as unknown as Thread, callback, name, `${name}.frag`, null as any);
        await vi.waitFor(() => expect(callback).toHaveBeenCalledOnce());
    }
    return shaders;
}

const names = (filters: any[]) => filters.map(f => f.shader);

test('the first shader added is active at once', async () => {
    let drawn: any[] = [];
    const shaders = await threeShaders(filters => drawn = filters);
    expect(names(drawn)).toEqual(['tint']);
    expect(shaders._getCurrentName()).toBe('tint');
    expect(shaders._getCurrentIndex()).toBe(0);
});

test('activated shaders take turns in the order they were added', async () => {
    let drawn: any[] = [];
    const shaders = await threeShaders(filters => drawn = filters);
    shaders._activate('blur');
    shaders._activate('waves');
    expect(names(drawn)).toEqual(['tint', 'waves', 'blur']);
    expect(shaders._isActive('waves')).toBe(true);
    expect(shaders._getCurrentName()).toBe('tint');
});

test('deactivate stops only that shader, and switchTo leaves exactly one', async () => {
    let drawn: any[] = [];
    const shaders = await threeShaders(filters => drawn = filters);
    shaders._activate('waves');
    shaders._deactivate('tint');
    expect(names(drawn)).toEqual(['waves']);
    expect(shaders._getCurrentIndex()).toBe(1);
    shaders._activate('blur');
    shaders._switchToName('tint');
    expect(names(drawn)).toEqual(['tint']);
    shaders._switchToIndex(-1);
    expect(names(drawn)).toEqual(['blur']);
});

test('next and reset work as before', async () => {
    let drawn: any[] = [];
    const shaders = await threeShaders(filters => drawn = filters);
    shaders._next();
    expect(shaders._getCurrentName()).toBe('waves');
    shaders._reset();
    expect(drawn).toEqual([]);
    expect(shaders._getCurrent()).toBeUndefined();
    shaders._next();
    expect(shaders._getCurrentName()).toBe('tint');
});

test('a copy for a clone keeps which shaders are active', async () => {
    const shaders = await threeShaders(() => {});
    shaders._activate('blur');
    let copied: any[] = [];
    const copy = shaders.copyFor(filters => copied = filters);
    expect(names(copied)).toEqual(['tint', 'blur']);
    copy._deactivate('blur');
    expect(shaders._isActive('blur')).toBe(true);
});
