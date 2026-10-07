import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import '../compiler/common/interpreter/Interpreter';
import { JavaCompiler } from '../compiler/java/JavaCompiler';
import { JavaLibraryManager } from '../compiler/java/runtime/JavaLibraryManager';
import { NonPrimitiveType } from '../compiler/java/types/NonPrimitiveType';
import { TokenType } from '../compiler/java/TokenType';
import { CompilerFile } from '../compiler/common/module/CompilerFile';
import { ScratchWindowClass } from '../compiler/java/runtime/graphics/scratch/ScratchWindowClass';
import contract from '../../public/scratch-compatibility.json';
import reference from './fixtures/scratch-reference-examples.json';

// Explicit maintenance operation; ordinary test runs only read the snapshot.
const snapshotPath = path.resolve(__dirname, '../../public/scratch-api.json');

test('the compatibility inventory matches both current browser library flavors', () => {
    const inventory = {};
    for (const [flavor, ids] of Object.entries({ standard: ['scratch'], nrw: ['scratch', 'nrw'] })) {
        const compiler = new JavaCompiler();
        const libraries = new JavaLibraryManager();
        libraries.addLibraries(...ids);
        libraries.addLibrariesToCompiler(compiler);
        inventory[flavor] = Object.fromEntries(compiler.libraryModuleManager.javaTypes
            .filter(type => type instanceof NonPrimitiveType && type.getAbsoluteName().startsWith('org.openpatch.scratch.'))
            .map((type: NonPrimitiveType) => [type.pathAndIdentifierAsDotSeparatedString,
                type.getAllMethods().filter(method => method.visibility === TokenType.keywordPublic
                    && (!method.isConstructor || method.identifier === type.identifier))
                    .map(method => ({
                        name: method.identifier,
                        constructor: method.isConstructor,
                        static: method.isStatic,
                        parameters: method.parameters.map(parameter => parameter.type.getAbsoluteName()),
                        returns: method.returnParameterType?.getAbsoluteName() ?? type.getAbsoluteName(),
                    }))
                    .sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : JSON.stringify(a) > JSON.stringify(b) ? 1 : 0)])
            .sort(([a], [b]) => String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0));
    }
    if (process.env.UPDATE_SCRATCH_INVENTORY === '1') {
        fs.writeFileSync(snapshotPath, JSON.stringify(inventory, null, 2) + '\n');
    }
    expect(inventory).toEqual(JSON.parse(fs.readFileSync(snapshotPath, 'utf8')));
});

test('the runtime reports the browser revision in the published compatibility contract', () => {
    expect(new ScratchWindowClass()._getLibraryVersion()).toBe(contract.browser.version);
    expect(contract.browser.version).toMatch(/^\d+\.\d+\.\d+-browser\.\d+$/);
    expect(reference.desktopVersion).toBe(contract.desktopVersion);
    expect(reference.browserVersion).toBe(contract.browser.version);
    expect(reference.examples).toHaveLength(contract.referenceValidation.examples);
});

test('known unsupported examples remain readable and cannot be advertised as runnable', () => {
    const members = new Map(contract.members.map(member => [member.id, member]));
    const unsupported = reference.examples.filter(example => example.expectedDiagnostics.length);
    expect(unsupported).toHaveLength(contract.referenceValidation.knownUnsupportedExamples);
    for (const example of reference.examples) {
        const member = members.get(example.member);
        expect(member, example.id).toBeDefined();
        if (example.expectedDiagnostics.length) {
            expect(member.status, example.id).toBe('awaiting-browser-support');
            expect(member.reason.trim().length, example.id).toBeGreaterThan(0);
            expect(example.runnable, example.id).toBe(false);
        }
        if (member.status === 'desktop-only') expect(example.runnable, example.id).toBe(false);
    }
    expect(reference.examples.find(example => example.id === 'Sprite/clone#0')?.runnable).toBe(true);
});

test.each(reference.examples)('browser compilation of reference $id', async example => {
    const compiler = new JavaCompiler();
    const libraries = new JavaLibraryManager();
    libraries.addLibraries(...contract.browser.flavors.standard.libraries);
    libraries.addLibrariesToCompiler(compiler);
    compiler.setFiles(example.files.map(({ name, source }) => {
        const file = new CompilerFile(name);
        file.setText(source);
        return file;
    }));
    const executable = await compiler.compileIfDirty();
    expect(executable, `${example.id}: compiler produced no executable`).toBeDefined();
    const diagnostics = executable.getAllErrors().filter(error => error.level === 'error')
        .map(error => ({ id: error.id ?? null, range: error.range }));
    expect(diagnostics, example.id).toEqual(example.expectedDiagnostics);
});
