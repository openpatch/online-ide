/**
 * Every file of an embedded workspace needs a name: the workspace is cached in
 * IndexedDB and restored on the next visit, and restoring checks each name as a
 * project path. A script without a title used to become a file named
 * "undefined", which was saved but could not be restored.
 *
 * Gives every script without a usable title one that is not taken yet in its
 * workspace: Main.java, Main2.java, ... for code, Hint.md, Hint2.md, ... for
 * hints. Titles of hints get ".md" appended, as before.
 */
export function assignScriptTitles(scripts: { title?: string, isHint?: boolean }[]): void {
    for (const script of scripts) {
        const title = script.title?.trim();
        script.title = title && script.isHint && !title.endsWith(".md") ? title + ".md" : title;
    }
    const taken = new Set(scripts.map(script => script.title?.toLowerCase()).filter(title => title));
    for (const script of scripts) {
        if (script.title) continue;
        const [base, extension] = script.isHint ? ["Hint", ".md"] : ["Main", ".java"];
        let title = base + extension;
        for (let index = 2; taken.has(title.toLowerCase()); index++) title = base + index + extension;
        taken.add(title.toLowerCase());
        script.title = title;
    }
}
