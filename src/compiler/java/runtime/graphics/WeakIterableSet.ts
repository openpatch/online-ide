/** An iterable registry whose entries remain owned by their callers. */
export class WeakIterableSet<T extends object> {
    private references = new Set<WeakRef<T>>();
    private index = new WeakMap<T, WeakRef<T>>();
    private finalized = new FinalizationRegistry<WeakRef<T>>(reference => this.references.delete(reference));

    add(value: T): void {
        if (this.index.has(value)) return;
        const reference = new WeakRef(value);
        this.index.set(value, reference);
        this.references.add(reference);
        this.finalized.register(value, reference, reference);
    }

    delete(value: T): void {
        const reference = this.index.get(value);
        if (reference) {
            this.references.delete(reference);
            this.finalized.unregister(reference);
        }
        this.index.delete(value);
    }

    has(value: T): boolean { return this.index.has(value); }

    clear(): void {
        for (const reference of this.references) this.finalized.unregister(reference);
        this.references.clear();
        this.index = new WeakMap();
    }

    *[Symbol.iterator](): IterableIterator<T> {
        for (const reference of this.references) {
            const value = reference.deref();
            if (value) yield value;
            else this.references.delete(reference);
        }
    }
}
