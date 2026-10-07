// The interpreter must load first because the runtime has circular imports.
import { Interpreter } from '../../compiler/common/interpreter/Interpreter';
import { GraphicsManager } from '../../compiler/common/interpreter/GraphicsManager';
import { SchedulerState } from '../../compiler/common/interpreter/SchedulerState';
import { JavaCompiler } from '../../compiler/java/JavaCompiler';
import { JavaLibraryManager } from '../../compiler/java/runtime/JavaLibraryManager';
import { CompilerFile } from '../../compiler/common/module/CompilerFile';
import { StoreOutputPrintManager } from '../StoreOutputPrintManager';
import { activeScratchStage } from '../../compiler/java/runtime/graphics/scratch/ScratchStages';
import { scratchGameClock } from '../../compiler/java/runtime/graphics/scratch/ScratchGameClock';
import { ScratchCostumes } from '../../compiler/java/runtime/graphics/scratch/ScratchCostumes';
import assetCatalog from '../../compiler/java/runtime/graphics/scratch/catalogs/assets.json';

let interpreter: Interpreter;
let output: StoreOutputPrintManager;
(window as any).scratchTest = {
    async start(source: string, flavor = 'standard') {
        const compiler = new JavaCompiler();
        const libraries = new JavaLibraryManager();
        libraries.addLibraries(...(flavor === 'nrw' ? ['scratch', 'nrw'] : ['scratch']));
        libraries.addLibrariesToCompiler(compiler);
        const file = new CompilerFile('LifecycleProbe.java');
        file.setText(source);
        compiler.setFiles([file]);
        const executable = await compiler.compileIfDirty();
        if (!executable) throw new Error('Compiler returned no executable');
        const errors = executable.getAllErrors().filter(error => error.level === 'error');
        if (errors.length) throw new Error(JSON.stringify(errors));
        output = new StoreOutputPrintManager();
        interpreter = new Interpreter(output, undefined, new GraphicsManager(document.getElementById('graphics'), undefined));
        interpreter.setExecutable(executable);
        if (!executable.isCompiledToJavascript) throw new Error('Executable was not compiled');
        interpreter.start();
    },
    snapshot() {
        const stage: any = activeScratchStage();
        const clock = scratchGameClock();
        return { output: output?.output, state: interpreter?.scheduler.state,
            error: interpreter?.scheduler.state === SchedulerState.error,
            exception: interpreter?.exception?.message,
            steps: clock.steps, millis: clock.millis, paused: clock.paused,
            renderer: stage?.world?.app?.renderer?.type,
            assets: assetCatalog.images.length,
            missingAssets: assetCatalog.images.filter(image => {
                const texture = ScratchCostumes.getTexture(image.id);
                const facing = ((image.direction % 360) + 360) % 360;
                const quarterTurn = facing === 0 || facing === 180;
                return !texture || texture.width !== (quarterTurn ? image.height : image.width)
                    || texture.height !== (quarterTurn ? image.width : image.height);
            }).map(image => image.id),
            sprites: stage?.sprites.map((sprite: any) => ({ x: sprite._getX(), y: sprite._getY(),
                clone: sprite._isClone(), speech: !!sprite['speechBubble'] })),
            monitors: stage ? [stage, ...stage.sprites].flatMap(owner => [...owner.variableMonitors.entries.values()]
                .map((monitor: any) => ({ label: monitor.label, text: monitor.text, visible: !!monitor.container?.parent }))) : [],
        };
    },
    step() { scratchGameClock().step(); },
    pause() { scratchGameClock().pause(); },
    resume(speed = 1) { scratchGameClock().setSpeed(speed); scratchGameClock().resume(); },
    stop() { interpreter?.setState(SchedulerState.stopped); },
};
