import * as PIXI from 'pixi.js';
import { Program } from '../../../../common/interpreter/Program';
import { ThreadState } from '../../../../common/interpreter/ThreadState';
import type { Thread } from '../../../../common/interpreter/Thread';
import type { SupplierInterface } from './SupplierInterface';
import { StringClass } from '../../system/javalang/ObjectClassStringClass';

export function formatMonitorValue(value: any): string {
    if (value == null) return '';
    if (Array.isArray(value)) return '[' + value.map(formatMonitorValue).join(', ') + ']';
    const raw = value instanceof StringClass || typeof value?.value !== 'undefined' ? value.value : value;
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(Math.round(raw * 100) / 100);
    return String(raw);
}

type Monitor = { label: string, text: string, program: Program, thread?: Thread, started?: number,
    container?: PIXI.Container, lastDrawn?: string };

/** Monitors run suppliers in a Java try/catch, independently of game pause. */
export class ScratchMonitors {
    readonly entries = new Map<string, Monitor>();

    show(thread: Thread, name: string, supplier: SupplierInterface, label = name) {
        this.hide(name);
        const module = thread.currentProgramState.program.module;
        const program = new Program(module, undefined, 'variable monitor');
        // This runtime program is already compiled; do not retain disposed
        // suppliers in the compiler's list of programs awaiting compilation.
        module.programsToCompileToFunctions.splice(module.programsToCompileToFunctions.indexOf(program), 1);
        const monitor: Monitor = { label, text: '', program };
        const done = (value: any) => { monitor.text = formatMonitorValue(value); monitor.thread = undefined; };
        program.addCompiledSteps([
            t => {
                t.beginTryBlock({ catchBlockInfos: [{ exceptionTypes: { RuntimeException: true }, catchBlockBeginsWithStepIndex: 3 }], stackSize: 0 });
                supplier._mj$get$T$(t, undefined);
                return 1;
            },
            (t, stack) => {
                const value = stack.pop();
                if (value && !Array.isArray(value) && typeof value.value === 'undefined' && value._mj$toString$String$) {
                    value._mj$toString$String$(t, undefined);
                } else stack.push(formatMonitorValue(value));
                return 2;
            },
            (t, stack) => { t.endCatchTryBlock(); done(stack.pop()); t.return(undefined); return -1; },
            t => { t.getExceptionAndTrimStack(true); done('?'); t.return(undefined); return -1; },
        ]);
        this.entries.set(name, monitor);
    }

    hide(name: string) {
        const monitor = this.entries.get(name);
        if (monitor?.thread) monitor.thread.state = ThreadState.terminated;
        monitor?.container?.destroy({ children: true });
        this.entries.delete(name);
    }

    clear() { for (const name of [...this.entries.keys()]) this.hide(name); }

    detach() {
        for (const monitor of this.entries.values()) {
            if (monitor.thread) monitor.thread.state = ThreadState.terminated;
            monitor.thread = undefined;
            monitor.container?.destroy({ children: true });
            monitor.container = undefined;
        }
    }

    static refresh(stage: any) {
        const monitors: Monitor[] = [...stage.variableMonitors.entries.values()];
        for (const sprite of stage.sprites) monitors.push(...sprite.variableMonitors.entries.values());
        const layer = stage.scratchLayers?.root;
        if (!layer) return;
        for (const [index, monitor] of monitors.entries()) {
            if (monitor.thread && performance.now() - monitor.started! > 1000) {
                monitor.thread.state = ThreadState.terminated;
                monitor.thread = undefined;
                monitor.text = '?';
            }
            if (!monitor.thread) {
                monitor.thread = stage.world.interpreter.scheduler.createThread('variable monitor');
                monitor.started = performance.now();
                monitor.thread.pushProgram(monitor.program);
                monitor.thread.state = ThreadState.running;
            }
            if (monitor.lastDrawn !== monitor.text || !monitor.container) {
                monitor.container?.destroy({ children: true });
                const container = new PIXI.Container();
                const style = { fontFamily: 'UbuntuMono, monospace', fontSize: 12 };
                const label = new PIXI.Text({ text: monitor.label, style: { ...style, fill: 0x575e75 } });
                const value = new PIXI.Text({ text: monitor.text, style: { ...style, fill: 0xffffff } });
                const valueWidth = Math.max(30, value.width + 14);
                const box = new PIXI.Graphics().roundRect(0, 0, label.width + valueWidth + 18, 24, 4)
                    .fill({ color: 0xe6f0ff, alpha: 235 / 255 }).stroke({ color: 0xc3ccd9, width: 1 });
                box.roundRect(label.width + 12, 3, valueWidth, 18, 9).fill(0xff8c1a);
                label.position.set(6, 5);
                value.position.set(label.width + 12 + (valueWidth - value.width) / 2, 5);
                container.addChild(box, label, value);
                layer.addChild(container);
                monitor.container = container;
                monitor.lastDrawn = monitor.text;
            }
            monitor.container.position.set(6, 6 + index * 28);
        }
    }
}
