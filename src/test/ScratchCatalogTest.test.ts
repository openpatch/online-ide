import { expect, test } from 'vitest';
import { applyScratchCatalog } from '../compiler/java/runtime/graphics/scratch/ScratchCatalog';
import { setLanguageId } from '../tools/language/LanguageManager';
import catalog from '../compiler/java/runtime/graphics/scratch/catalogs/api.json';
import type { LibraryKlassType } from '../compiler/java/module/libraries/JavaLibraryModule';

test('Javadoc supplies English help while the stable identifier retains its German translation', () => {
    const klass: LibraryKlassType = { __javaDeclarations: [
        { type: 'declaration', signature: 'class Sprite' },
        { type: 'method', signature: 'void move(double steps)', comment: () => 'fallback', native: () => {} },
    ] };
    applyScratchCatalog(klass);
    const comment = klass.__javaDeclarations[1].comment as () => string;
    try {
        setLanguageId('en');
        expect(comment()).toBe(catalog.methods.find(entry => entry.id === 'Sprite/move(double)')!.description);
        setLanguageId('de');
        expect(comment()).toBe(catalog.methods.find(entry => entry.id === 'Sprite/move(double)')!.translations.de.description);
    } finally { setLanguageId('de'); }
});

test('desktop availability is visible and additional browser declarations keep their comments', () => {
    const klass: LibraryKlassType = { __javaDeclarations: [
        { type: 'declaration', signature: 'class Stage' },
        { type: 'method', signature: 'int[] getPixels()', comment: () => 'original', native: () => {} },
        { type: 'method', signature: 'void browserExtra()', comment: () => 'extra', native: () => {} },
    ] };
    applyScratchCatalog(klass);
    expect((klass.__javaDeclarations[1].comment as () => string)()).toContain('Desktop');
    expect((klass.__javaDeclarations[2].comment as () => string)()).toBe('extra');
});
