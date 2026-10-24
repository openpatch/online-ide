import { expect, test } from 'vitest';
import '../compiler/common/interpreter/Interpreter';
import { JavaCompiler } from '../compiler/java/JavaCompiler';
import { JavaLibraryManager } from '../compiler/java/runtime/JavaLibraryManager';
import { CompilerFile } from '../compiler/common/module/CompilerFile';

test.each([{ ids: ['scratch'] }, { ids: ['scratch', 'nrw'] }])('portable SaveData API compiles with $ids', async ({ ids }) => {
    const compiler = new JavaCompiler();
    const libraries = new JavaLibraryManager();
    libraries.addLibraries(...ids);
    libraries.addLibrariesToCompiler(compiler);
    const file = new CompilerFile('SaveProbe.java');
    file.setText(`
        import java.io.IOException;
        import org.openpatch.scratch.save.SaveData;
        class Progress { public int coins = 0; }
        void main() {
            SaveData<Progress> save = new SaveData<>("org.example.game", "slot1", Progress.class);
            try {
                Progress progress = save.loadOrDefault(() -> new Progress());
                progress.coins++;
                save.save(progress);
                println(save.getLocation());
            } catch (IOException error) { println(error.getMessage()); }
        }
    `);
    compiler.setFiles([file]);
    const executable = await compiler.compileIfDirty();
    expect(executable).toBeDefined();
    expect(executable!.getAllErrors().filter(error => error.level === 'error')).toEqual([]);
});
