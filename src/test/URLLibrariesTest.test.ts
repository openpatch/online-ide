import { expect, test } from "vitest";
// the interpreter first: the runtime has circular imports
import "../compiler/common/interpreter/Interpreter";
import { JavaLibraryManager } from "../compiler/java/runtime/JavaLibraryManager";
import { URL_PARAMETERS } from "../client/embedded/EmbeddedURLConfig";

test("the help for ?libraries= names every library", () => {
    const documented = URL_PARAMETERS.find(p => p.name == "libraries")!.values.split(",").map(v => v.trim());
    expect(documented.sort()).toEqual(JavaLibraryManager.libraries.map(l => l.id).sort());
});
