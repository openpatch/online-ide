import fs from 'node:fs';
import { test, expect } from 'vitest';
import { checkCompilation, runTestProgram } from './CompilerTestHarness';
import { JavaCompiler } from '../compiler/java/JavaCompiler';
import { JavaLibraryManager } from '../compiler/java/runtime/JavaLibraryManager';
import { CompilerFile } from '../compiler/common/module/CompilerFile';

// These are the unchanged curriculum sources used by Studio's JUnit adapter.
const sources = ['Punkteregel.java', 'PunkteregelTest.java'].map(name => ({
    name, source: fs.readFileSync(new URL('./teaching/' + name, import.meta.url), 'utf8'),
}));
async function compile(wrongInitialScore = false) {
    const compiler = new JavaCompiler();
    const libraries = new JavaLibraryManager();
    libraries.addLibraries('scratch', 'nrw');
    libraries.addLibrariesToCompiler(compiler);
    const files = sources.map(({ name, source }) => {
        const file = new CompilerFile(name);
        file.setText(wrongInitialScore ? source.replace('private int punkte = 0;', 'private int punkte = 1;') : source);
        return file;
    });
    const main = new CompilerFile('Main.java');
    main.setText('void main() { PunkteregelTest tests = new PunkteregelTest();'
        + ' tests.amAnfangIstAllesNull(); tests.grenzeZumDoppelten();'
        + ' tests.grenzeZumDreifachen(); tests.einFehlerSetztDieKomboZurueck();'
        + ' assertCodeReached("All four score checks ran"); }');
    compiler.setFiles([...files, main]);
    const executable = await compiler.compileIfDirty();
    checkCompilation(executable, {});
    return executable!;
}
test('the four portable score checks execute in the browser interpreter', async () => {
    runTestProgram(await compile(), 0, '');
});
test('the same checks detect an incorrect initial score', async () => {
    const executable = await compile(true);
    expect(() => runTestProgram(executable, 0, '')).toThrow();
});
