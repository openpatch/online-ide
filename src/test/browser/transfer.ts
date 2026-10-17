import '../../compiler/common/interpreter/Interpreter';
import { MainEmbedded } from '../../client/embedded/MainEmbedded';
import { exportProjectZip } from '../../client/workspace/PortableProject';
import { ScratchWorkspaceAssets } from '../../compiler/java/runtime/graphics/scratch/ScratchWorkspaceAssets';
import { ScratchShaderClass } from '../../compiler/java/runtime/graphics/scratch/ScratchShaders';

const initialize = MainEmbedded.prototype.init;
MainEmbedded.prototype.init = async function (...args) {
    await initialize.apply(this, args);
    const ide = this;
    (window as any).transferTest = {
        editor() {
            const editor = ide.getMainEditor();
            return { text: editor.getValue(), language: editor.getModel()?.getLanguageId(),
                readOnly: editor.getRawOptions().readOnly };
        },
        async shaderFragment(path: string) {
            await ScratchWorkspaceAssets.load(ide.getCurrentWorkspace());
            const shader = new ScratchShaderClass();
            await shader.load(path, null);
            return shader.filter!.glProgram!.fragment;
        },
        snapshot() {
            const ws = ide.getCurrentWorkspace();
            return { settings: ws.settings, name: ws.name,
                files: ws.getFiles().map(file => ({ name: [...ws.getPath(file), file.name].join('/'), text: file.getText() })) };
        },
        edit(name: string, text: string) {
            const file = ide.getCurrentWorkspace().getFiles().find(file => file.name === name)!;
            file.setText(text);
            file.setSaved(false);
            ide.saveScripts();
        },
        async saved() {
            return new Promise(resolve => ide.indexedDB.getScript(ide.config.id + '-workspace', resolve));
        },
        makeZip(workspace: any) { return exportProjectZip(workspace).then(bytes => [...bytes]); },
        async compile() {
            const executable = await ide.getCompiler().compileIfDirty();
            return executable?.getAllErrors().filter(error => error.level === 'error').map(error => error.message);
        },
    };
};
await import('../../client/embedded/EmbeddedStarter');
