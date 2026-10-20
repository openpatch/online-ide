import { describe, expect, test } from 'vitest';
import { assignScriptTitles } from '../client/embedded/ScriptTitles';
import { projectPath } from '../client/workspace/PortableProject';

describe('titles of embedded scripts', () => {
    test('scripts without a title get free names the workspace can restore', () => {
        const scripts = [{ title: undefined }, { title: 'Main.java' }, { title: '  ' }, { isHint: true }, { title: 'Tip', isHint: true }];
        assignScriptTitles(scripts);
        expect(scripts.map(script => script.title)).toEqual(['Main2.java', 'Main.java', 'Main3.java', 'Hint.md', 'Tip.md']);
        for (const script of scripts) expect(projectPath(script.title!)).toBe(script.title);
    });

    test('given titles are kept, apart from surrounding blanks', () => {
        const scripts = [{ title: ' A Hint ', isHint: true }, { title: 'Notes.md', isHint: true }, { title: 'Test.java ' }];
        assignScriptTitles(scripts);
        expect(scripts.map(script => script.title)).toEqual(['A Hint.md', 'Notes.md', 'Test.java']);
    });
});
