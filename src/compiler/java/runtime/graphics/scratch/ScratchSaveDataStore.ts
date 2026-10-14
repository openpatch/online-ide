/** Game saves are independent of the IDE's workspace/script cache. */
export const scratchSaveDatabase = 'ScratchForJavaSaveData';
const storeName = 'saves';

/** A new connection per operation also handles reloads and database upgrades. */
function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB is unavailable in this browser'));
            return;
        }
        const request = indexedDB.open(scratchSaveDatabase, 1);
        let blocked = false;
        request.onupgradeneeded = () => request.result.createObjectStore(storeName);
        request.onerror = () => reject(request.error ?? new Error('Could not open save database'));
        request.onblocked = () => {
            blocked = true;
            reject(new Error('Save database is blocked by another page'));
        };
        request.onsuccess = () => {
            const database = request.result;
            database.onversionchange = () => database.close();
            if (blocked) database.close();
            else resolve(database);
        };
    });
}

/** Resolves only after commit, never merely after the put request succeeds. */
async function transaction(gameId: string, slot: string, json?: string): Promise<string | undefined> {
    const database = await openDatabase();
    try {
        return await new Promise((resolve, reject) => {
            const tx = database.transaction(storeName, json === undefined ? 'readonly' : 'readwrite');
            const store = tx.objectStore(storeName);
            let result: unknown;
            const request = json === undefined ? store.get([gameId, slot]) : store.put(json, [gameId, slot]);
            request.onsuccess = () => { result = request.result; };
            tx.onabort = () => reject(tx.error ?? request.error ?? new Error('Save transaction was aborted'));
            tx.oncomplete = () => {
                if (json !== undefined || result === undefined) resolve(undefined);
                else if (typeof result === 'string') resolve(result);
                else reject(new Error('Save record is not JSON text'));
            };
        });
    } finally {
        database.close();
    }
}

export function readScratchSave(gameId: string, slot: string): Promise<string | undefined> {
    return transaction(gameId, slot);
}

export async function writeScratchSave(gameId: string, slot: string, json: string): Promise<void> {
    await transaction(gameId, slot, json);
}
