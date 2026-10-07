import catalog from './catalogs/api.json';
import { currentLanguageId } from '../../../../../tools/language/LanguageManager';
import type { LibraryKlassType } from '../../../module/libraries/JavaLibraryModule';

function simple(type: string): string {
    while (/<[^<>]*>/.test(type)) type = type.replace(/<[^<>]*>/g, '');
    return type.replace(/\b(?:\w+\.)+(\w+)/g, '$1').replace(/\s/g, '').replace(/string/g, 'String');
}
const entries = new Map(catalog.methods.map(entry => [
    entry.className + '/' + entry.methodName + '(' + entry.parameterTypes.map(simple).join(',') + ')', entry,
]));
const applied = new WeakSet<object>();

/** Shared Javadoc descriptions with explicit translations; original comments cover extra browser APIs. */
export function applyScratchCatalog(klass: LibraryKlassType) {
    if (applied.has(klass)) return;
    applied.add(klass);
    const declaration = klass.__javaDeclarations.find(entry => entry.type === 'declaration');
    const owner = declaration?.signature.match(/\b(?:class|interface|enum)\s+(\w+)/)?.[1];
    if (!owner) return;
    for (const declaration of klass.__javaDeclarations) {
        if (declaration.type !== 'method') continue;
        const method = declaration.signature.match(/(\w+)\s*\((.*?)\)/);
        if (!method) continue;
        let depth = 0, part = '';
        const parameters: string[] = [];
        for (const character of method[2] + ',') {
            depth += Number(character === '<') - Number(character === '>');
            if (character === ',' && !depth) {
                if (part.trim()) parameters.push(simple(part.trim().replace(/\s+\w+$/, '')));
                part = '';
            } else part += character;
        }
        const name = method[1] === owner ? 'constructor' : method[1];
        const entry = entries.get(owner + '/' + name + '(' + parameters.join(',') + ')');
        if (!entry) continue;
        const original = declaration.comment;
        declaration.comment = () => {
            const translations = entry.translations as Record<string, { description?: string }>;
            const description = currentLanguageId === 'de'
                ? translations.de?.description || (typeof original === 'function' ? original() : original) || entry.description
                : entry.description;
            const availability = entry.availability === 'desktop-only'
                ? (currentLanguageId === 'de' ? '\nNur im Desktop verfügbar.' : '\nAvailable on desktop only.') : '';
            return description + availability;
        };
    }
}
