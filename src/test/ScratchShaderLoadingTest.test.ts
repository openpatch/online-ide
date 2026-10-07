import { expect, test, vi } from 'vitest';
import '../compiler/common/interpreter/Interpreter';
import '../compiler/java/JavaCompiler';
import { ScratchShaderClass } from '../compiler/java/runtime/graphics/scratch/ScratchShaders';
import { Thread } from '../compiler/common/interpreter/Thread';
import { ThreadState } from '../compiler/common/interpreter/ThreadState';
import { RuntimeExceptionClass } from '../compiler/java/runtime/system/javalang/RuntimeException';

test('the shader constructor waits for loading and then resumes the Java thread', async () => {
    let finish!: () => void;
    const shader = new ScratchShaderClass();
    const load = vi.spyOn(shader, 'load').mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    const callback = vi.fn();
    const thread = { state: ThreadState.running, s: [], throwRuntimeExceptionOnLastExecutedStep: vi.fn() };
    shader._cj$_constructor_$Shader$string$string$string(thread as unknown as Thread, callback, 'blur', 'blur.frag', 'blur.vert');
    expect(thread.state).toBe(ThreadState.waiting);
    expect(callback).not.toHaveBeenCalled();
    expect(load).toHaveBeenCalledWith('blur.frag', 'blur.vert');
    finish();
    await vi.waitFor(() => expect(callback).toHaveBeenCalledOnce());
    expect(thread.state).toBe(ThreadState.running);
    expect(thread.s).toEqual([shader]);
    expect(shader._getName()).toBe('blur');
    expect(thread.throwRuntimeExceptionOnLastExecutedStep).not.toHaveBeenCalled();
});

test('a shader load failure restores the thread and reports a Java runtime exception', async () => {
    const shader = new ScratchShaderClass();
    const error = new RuntimeExceptionClass('invalid fragment');
    vi.spyOn(shader, 'load').mockRejectedValue(error);
    const callback = vi.fn();
    const thread = { state: ThreadState.running, s: [], throwRuntimeExceptionOnLastExecutedStep: vi.fn() };
    shader._cj$_constructor_$Shader$string$string$string(thread as unknown as Thread, callback, 'blur', 'blur.frag', 'blur.vert');
    await vi.waitFor(() => expect(thread.throwRuntimeExceptionOnLastExecutedStep).toHaveBeenCalledWith(error));
    expect(thread.state).toBe(ThreadState.running);
    expect(callback).not.toHaveBeenCalled();
    expect(thread.s).toEqual([]);
});
