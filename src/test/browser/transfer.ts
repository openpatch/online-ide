import '../../compiler/common/interpreter/Interpreter';
import { MainEmbedded } from '../../client/embedded/MainEmbedded';
import { exportProjectZip } from '../../client/workspace/PortableProject';

const initialize = MainEmbedded.prototype.init;
MainEmbedded.prototype.init = async function (...args) {
    await initialize.apply(this, args);
    const ide = this;
    (window as any).transferTest = {
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
