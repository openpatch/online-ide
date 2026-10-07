import { test } from "vitest";
import { checkCompilation, readTestCases, runTestProgram } from "./CompilerTestHarness";
import { JavaCompiler } from "../compiler/java/JavaCompiler";
import { JavaLibraryManager } from "../compiler/java/runtime/JavaLibraryManager";
import { CompilerFile } from "../compiler/common/module/CompilerFile";

for (const { name, program, lineOffset, info } of readTestCases(__dirname + "/java", ".java")) {
    test(name, async () => {
        const compiler = new JavaCompiler();
        const libraries = new JavaLibraryManager();
        libraries.addLibraries(...(info.libraries ?? []));
        libraries.addLibrariesToCompiler(compiler);
        const file = new CompilerFile();
        file.setText(program);
        compiler.setFiles([file]);
        const executable = await compiler.compileIfDirty();
        if (checkCompilation(executable, info, lineOffset)) {
            runTestProgram(executable!, lineOffset, info.expectedOutput);
        }
    });
}
