import { expect, test } from "vitest";
import { checkCompilation, runTestProgram, TestInfo } from "./CompilerTestHarness";
import { JavaCompiler } from "../compiler/java/JavaCompiler";
import { CompilerFile } from "../compiler/common/module/CompilerFile";

async function compile(program: string, info: TestInfo = {}) {
    const compiler = new JavaCompiler();
    const file = new CompilerFile();
    file.setText(program);
    compiler.setFiles([file]);
    const executable = await compiler.compileIfDirty();
    checkCompilation(executable, info);
    return executable!;
}

test("missing compiler output cannot pass", () => {
    expect(() => checkCompilation(undefined, {})).toThrow("no executable");
});

test("unexpected compiler errors cannot pass", async () => {
    await expect(compile("missingMethod();")).rejects.toThrow("Unexpected");
});

test("an expected compiler error must actually occur", async () => {
    await expect(compile('print("ok");', { expectedCompilationError: { id: "missing-error" } }))
        .rejects.toThrow("Missing expected missing-error");
});

test("Java assertion failures propagate to Vitest", async () => {
    const executable = await compile('assertTrue(false, "deliberate failure");');
    expect(() => runTestProgram(executable)).toThrow("deliberate failure");
});

test("runtime exceptions cannot pass without an output assertion", async () => {
    const executable = await compile('throw new RuntimeException("boom");');
    expect(() => runTestProgram(executable)).toThrow("runtime error");
});

test("empty expected output is checked and blank lines are preserved", async () => {
    const executable = await compile('println("");');
    runTestProgram(executable, 0, "\n");
    expect(() => runTestProgram(executable, 0, "")).toThrow("Output mismatch");
});

test("a synchronous endless loop fails within its execution budget", async () => {
    const executable = await compile("while (true) { }");
    expect(() => runTestProgram(executable, 0, undefined, { maxBatches: 10, timeoutMs: 1000 }))
        .toThrow("execution budget");
});
