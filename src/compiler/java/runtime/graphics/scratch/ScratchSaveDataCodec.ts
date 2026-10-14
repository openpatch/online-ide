import type { Thread } from '../../../../common/interpreter/Thread';
import { TokenType } from '../../../TokenType';
import { JavaArrayType } from '../../../types/JavaArrayType';
import { IJavaClass, JavaClass } from '../../../types/JavaClass';
import { JavaEnum } from '../../../types/JavaEnum';
import type { JavaField } from '../../../types/JavaField';
import type { JavaType } from '../../../types/JavaType';
import { ObjectClass, StringClass } from '../../system/javalang/ObjectClassStringClass';

/** Plain JSON public fields, matching desktop Jackson rather than interpreter-internal field names. */
function publicFields(type: JavaClass): JavaField[] {
    const fields = new Map<string, JavaField>();
    for (let current: IJavaClass | undefined = type; current; current = current.getExtends()) {
        for (const field of current.getFields()) {
            if (field.visibility === TokenType.keywordPublic && !field.isStatic() && !field.isTransient()
                && !fields.has(field.identifier)) fields.set(field.identifier, field);
        }
    }
    return [...fields.values()];
}

function primitive(value: unknown, identifier: string): unknown {
    if (identifier === 'String' || identifier === 'string') {
        if (typeof value === 'string') return value;
    } else if (identifier === 'char') {
        if (typeof value === 'string' && value.length === 1) return value;
    } else if (identifier === 'boolean' || identifier === 'Boolean') {
        if (typeof value === 'boolean') return value;
    } else if (typeof value === 'number' && Number.isFinite(value)) {
        const ranges: Record<string, [number, number]> = {
            byte: [-128, 127], short: [-32768, 32767], int: [-2147483648, 2147483647],
            Byte: [-128, 127], Short: [-32768, 32767], Integer: [-2147483648, 2147483647],
        };
        if (ranges[identifier]) {
            if (Number.isInteger(value) && value >= ranges[identifier][0] && value <= ranges[identifier][1]) return value;
        } else if (identifier === 'long' || identifier === 'Long') {
            if (Number.isSafeInteger(value)) return value;
        } else if (['float', 'double', 'Float', 'Double'].includes(identifier)) return value;
    }
    throw new Error(`Expected ${identifier} in save data`);
}

const wrappers = ['String', 'Boolean', 'Byte', 'Short', 'Integer', 'Long', 'Float', 'Double', 'Character'];

function childArrayType(type: JavaArrayType): JavaType {
    return type.dimension === 1 ? type.elementType
        : new JavaArrayType(type.elementType, type.dimension - 1, type.module, type.identifierRange);
}

function encode(value: any, type: JavaType, ancestors: Set<object>, depth: number): unknown {
    if (depth > 128) throw new Error('Save data is nested too deeply');
    if (value == null) {
        if (type.isPrimitive && type.identifier !== 'string') throw new Error('Primitive save fields cannot be null');
        return null;
    }
    if (type.isPrimitive) return primitive(value, type.identifier);
    if (type instanceof JavaEnum) return value.name;
    if (type instanceof JavaClass && wrappers.includes(type.identifier)) {
        return primitive(value instanceof ObjectClass ? (value as any).value : value,
            type.identifier === 'Character' ? 'char' : type.identifier);
    }
    if (ancestors.has(value)) throw new Error('Save data contains an object cycle');
    ancestors.add(value);
    try {
        if (type instanceof JavaArrayType) {
            if (!Array.isArray(value)) throw new Error('Expected an array in save data');
            return value.map(element => encode(element, childArrayType(type), ancestors, depth + 1));
        }
        if (!(type instanceof JavaClass) || type.module.isLibraryModule || !(value instanceof ObjectClass)) {
            throw new Error('Use a data class with public fields, primitives, strings and arrays');
        }
        const result = Object.create(null);
        for (const field of publicFields(type)) {
            result[field.identifier] = encode(value[field.getInternalName()], field.type, ancestors, depth + 1);
        }
        return result;
    } finally {
        ancestors.delete(value);
    }
}

export function encodeScratchSave(value: ObjectClass, type: JavaClass): string {
    if (value == null) throw new Error('Save data must not be null');
    return JSON.stringify(encode(value, type, new Set(), 0));
}

type Plan = { build(thread: Thread, done: (value: any) => void): void };

/** Primitive array elements finish synchronously; loop instead of recursing once per element. */
function buildSequence(thread: Thread, plans: Plan[], assign: (index: number, value: any) => void, done: () => void) {
    let index = 0;
    let building = false;
    const next = () => {
        if (building) return;
        building = true;
        while (index < plans.length) {
            let completed = false;
            const current = index;
            plans[current].build(thread, value => {
                assign(current, value);
                index++;
                completed = true;
                if (!building) next();
            });
            if (!completed) { building = false; return; }
        }
        building = false;
        done();
    };
    next();
}

/** Validate the entire record before executing any user constructors. */
function decodePlan(value: any, type: JavaType, depth: number): Plan {
    if (depth > 128) throw new Error('Save data is nested too deeply');
    if (value === null) {
        if (type.isPrimitive && type.identifier !== 'string') throw new Error('Primitive save fields cannot be null');
        return { build: (_thread, done) => done(null) };
    }
    if (type.isPrimitive) {
        const data = primitive(value, type.identifier);
        return { build: (_thread, done) => done(data) };
    }
    if (type instanceof JavaEnum) {
        const data = type.runtimeClass?.values.find((item: any) => item.name === value);
        if (!data) throw new Error(`Unknown ${type.identifier} value in save data`);
        return { build: (_thread, done) => done(data) };
    }
    if (type instanceof JavaClass && wrappers.includes(type.identifier)) {
        const data = primitive(value, type.identifier === 'Character' ? 'char' : type.identifier);
        return { build: (_thread, done) => done(type.identifier === 'String'
            ? new StringClass(data as string) : new type.runtimeClass!(data)) };
    }
    if (type instanceof JavaArrayType) {
        if (!Array.isArray(value)) throw new Error('Expected an array in save data');
        const elements = value.map(element => decodePlan(element, childArrayType(type), depth + 1));
        return { build: (thread, done) => {
            const array: any[] = [];
            buildSequence(thread, elements, (index, item) => { array[index] = item; }, () => done(array));
        } };
    }
    if (!(type instanceof JavaClass) || type.module.isLibraryModule
        || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Expected a data object with public fields');
    }
    const fields = publicFields(type);
    if (Object.keys(value).some(key => !fields.some(field => field.identifier === key))) {
        throw new Error(`Unknown field in ${type.identifier} save data`);
    }
    const constructor = type.getOwnMethods().find(method => method.isConstructor
        && method.parameters.length === 0 && !method.hasOuterClassParameter);
    if (!constructor || !type.runtimeClass) throw new Error(`${type.identifier} needs a no-argument constructor`);
    const saved = fields.filter(field => Object.hasOwn(value, field.identifier))
        .map(field => ({ field, plan: decodePlan(value[field.identifier], field.type, depth + 1) }));
    return { build: (thread, done) => {
        const object = new type.runtimeClass!();
        const fill = () => {
            buildSequence(thread, saved.map(item => item.plan), (index, item) => {
                object[saved[index].field.getInternalName()] = item;
            }, () => done(object));
        };
        if (constructor.hasImplementationWithNativeCallingConvention) {
            object[constructor.getInternalName('native')]();
            fill();
        } else {
            object[constructor.getInternalName('java')](thread, () => { thread.s.pop(); fill(); });
        }
    } };
}

export function decodeScratchSave(thread: Thread, json: string, type: JavaClass,
    done: (value: ObjectClass) => void): void {
    const value = JSON.parse(json);
    if (value === null) throw new Error('Save data contains null');
    decodePlan(value, type, 0).build(thread, done);
}
