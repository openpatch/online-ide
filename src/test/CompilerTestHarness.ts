import fs from "node:fs";
import path from "node:path";
// Import the interpreter first: the runtime currently has circular imports.
import { Interpreter } from "../compiler/common/interpreter/Interpreter";
import { Executable } from "../compiler/common/Executable";
import { SchedulerState } from "../compiler/common/interpreter/SchedulerState";
import { SchedulerExitState } from "../compiler/common/interpreter/SchedulerExitState";
import { ThreadState } from "../compiler/common/interpreter/ThreadState";
import { StoreOutputPrintManager } from "./StoreOutputPrintManager";
import { ViteTestAssertions } from "./ViteTestAssertions";

export type ExpectedError = { id: string, line?: number };
export type TestInfo = {
    expectedOutput?: string;
    expectedCompilationError?: ExpectedError;
    expectedCompilationErrors?: ExpectedError[];
    libraries?: string[];
};

export type SourceTestCase = {
    name: string;
    program: string;
    lineOffset: number;
    info: TestInfo;
};

export function readTestCases(directory: string, extension: string): SourceTestCase[] {
    const cases: SourceTestCase[] = [];
    for (const filename of fs.readdirSync(directory).sort()) {
        if (!filename.endsWith(extension)) continue;
        const source = fs.readFileSync(path.join(directory, filename), "utf8").replace(/\r\n/g, "\n");
        const starts = [...source.matchAll(/\/\*\*::/g)].map(match => match.index!);
        for (let i = 0; i < starts.length; i++) {
            const begin = starts[i];
            const program = source.slice(begin, starts[i + 1] ?? source.length);
            const headerEnd = program.indexOf("*/");
            if (headerEnd < 0) throw new Error(`Unclosed test header in ${filename}`);
            const header = program.slice(0, headerEnd);
            const title = header.match(/\n\s*\* (.+)/)?.[1];
            if (!title) throw new Error(`Missing test title in ${filename}`);
            const metadataBegin = header.indexOf("{");
            const info: TestInfo = metadataBegin < 0 ? {} : JSON.parse(header.slice(metadataBegin));
            cases.push({ name: `File ${filename}: ${title}`, program,
                lineOffset: source.slice(0, begin).split("\n").length - 1, info });
        }
    }
    if (cases.length === 0) throw new Error(`No ${extension} test cases found in ${directory}`);
    return cases;
}

/** Verify diagnostics without mutating expected errors between retries. */
export function checkCompilation(executable: Executable | undefined, info: TestInfo, lineOffset = 0): boolean {
    if (!executable) throw new Error("Compiler returned no executable");
    const errors = executable.getAllErrors().filter(error => error.level === "error");
    const expected = [ ...(info.expectedCompilationErrors ?? []),
        ...(info.expectedCompilationError ? [info.expectedCompilationError] : []) ];
    const matches = (expectedError: ExpectedError, error: typeof errors[number]) =>
        expectedError.id === error.id && (expectedError.line === undefined || expectedError.line === error.range.startLineNumber);
    const problems = errors.filter(error => !expected.some(expectedError => matches(expectedError, error)))
        .map(error => `Unexpected ${error.id} at line ${error.range.startLineNumber + lineOffset}: ${error.message}`);
    problems.push(...expected.filter(expectedError => !errors.some(error => matches(expectedError, error)))
        .map(error => `Missing expected ${error.id}${error.line === undefined ? "" : ` at relative line ${error.line}`}`));
    if (problems.length) throw new Error(problems.join("\n"));
    if (errors.length) return false;
    return true;
}

/** A synchronous loop cannot be stopped by Vitest's asynchronous timeout. */
export function runTestProgram(executable: Executable, lineOffset = 0, expectedOutput?: string,
    limits = { maxBatches: 10000, timeoutMs: 5000 }): void {
    const output = new StoreOutputPrintManager();
    const interpreter = new Interpreter(output);
    interpreter.setExecutable(executable);
    if (!executable.isCompiledToJavascript) throw new Error("Executable was not compiled to JavaScript");
    const assertions = new ViteTestAssertions(lineOffset);
    interpreter.attachAssertionObserver(assertions);
    interpreter.start();
    const scheduler = interpreter.scheduler;
    const deadline = performance.now() + limits.timeoutMs;
    scheduler.runsSynchronously = true;
    try {
        let batches = 0;
        while (scheduler.state === SchedulerState.running) {
            if (++batches > limits.maxBatches || performance.now() > deadline) {
                throw new Error("Program exceeded the synchronous test execution budget");
            }
            if (scheduler.run(100) === SchedulerExitState.nothingMoreToDo) break;
            if (scheduler.state === SchedulerState.running && !scheduler.runningThreads.some(thread => thread.state === ThreadState.running)) {
                throw new Error("Program is waiting for an asynchronous operation; use an asynchronous browser test");
            }
        }
        assertions.throwIfFailed();
        if (scheduler.state === SchedulerState.error) throw new Error(`Program terminated with a runtime error\n${output.output}`);
        if (scheduler.state !== SchedulerState.stopped) {
            throw new Error("Program did not finish; waiting/graphics programs need an asynchronous browser test");
        }
        const unreached = interpreter.codeReachedAssertions.getUnreachedAssertions();
        if (unreached.length) throw new Error(unreached.map(assertion =>
            `Unreached assertion at line ${assertion.range.startLineNumber + lineOffset}: ${assertion.messageIfNotReached}`).join("\n"));
        if (expectedOutput !== undefined && output.output !== expectedOutput) {
            throw new Error(`Output mismatch: expected ${JSON.stringify(expectedOutput)}, received ${JSON.stringify(output.output)}`);
        }
    } finally {
        scheduler.runsSynchronously = false;
        interpreter.setState(SchedulerState.stopped);
    }
}
