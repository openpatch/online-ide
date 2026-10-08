import { expect, test } from "vitest";
// the interpreter first: the runtime has circular imports
import "../compiler/common/interpreter/Interpreter";
import { JavaFormatter } from "../compiler/java/monacoproviders/JavaFormatter";

/** The formatter's edits applied as Monaco applies them (column 0 counts as 1), last one first. */
function applyEdits(text: string, edits: { range: any, text: string }[]): string {
    let lines = text.split("\n");
    let sorted = edits.slice().sort((a, b) => b.range.startLineNumber - a.range.startLineNumber
        || b.range.startColumn - a.range.startColumn);
    for (let edit of sorted) {
        let r = edit.range;
        let before = lines[r.startLineNumber - 1].slice(0, Math.max(1, r.startColumn) - 1);
        let after = lines[r.endLineNumber - 1].slice(Math.max(1, r.endColumn) - 1);
        lines.splice(r.startLineNumber - 1, r.endLineNumber - r.startLineNumber + 1, ...(before + edit.text + after).split("\n"));
    }
    return lines.join("\n");
}

/** Formats the text as a file whose detected indentation is the given one. */
function format(text: string, insertSpaces: boolean, size: number): string {
    let model: any = { getValue: () => text, getOptions: () => ({ insertSpaces, tabSize: size, indentSize: size }) };
    let formatter: any = Object.create(JavaFormatter.prototype);
    formatter.language = { getSettings: () => ({ getValue: () => "no" }) };
    formatter.findMainForModel = () => undefined;
    return applyEdits(text, formatter.format(model));
}

const unindented = "class A {\nvoid m() {\nint x = 1;\n}\n}\n";

test("the formatter indents with the IDE's 3 spaces by default", () => {
    expect(format(unindented, true, 3)).toBe("class A {\n   void m() {\n      int x = 1;\n   }\n}\n");
});

test("the formatter keeps a file's 2-space indentation and straightens stray lines", () => {
    let text = "class A {\n  void m() {\n    int x = 1;\n      int y = 2;\n\tint w = 0;\n  }\n}\n";
    expect(format(text, true, 2)).toBe("class A {\n  void m() {\n    int x = 1;\n    int y = 2;\n    int w = 0;\n  }\n}\n");
});

test("the formatter indents a tab-indented file with tabs", () => {
    let text = "class A {\nvoid m() {\n    int x = 1;\n}\n}\n";
    expect(format(text, false, 4)).toBe("class A {\n\tvoid m() {\n\t\tint x = 1;\n\t}\n}\n");
});
