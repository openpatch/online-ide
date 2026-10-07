import { test } from "vitest";
import { checkCompilation, readTestCases, runTestProgram } from "./CompilerTestHarness";
import { ByAssemblyCompiler } from "../compiler/assembly/byassembly/ByAssemblyCompiler";
import { CompilerFile } from "../compiler/common/module/CompilerFile";

for (const { name, program, lineOffset, info } of readTestCases(__dirname + "/assembly", ".asm")) {
    test(name, async () => {
        const compiler = new ByAssemblyCompiler();
        const file = new CompilerFile();
        file.setText(program);
        compiler.setFiles([file]);
        const executable = compiler.compileIfDirty();
        if (checkCompilation(executable, info, lineOffset)) {
            runTestProgram(executable!, lineOffset, info.expectedOutput);
        }
    });
}
