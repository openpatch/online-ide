import { ClassDiagram } from "../main/gui/diagrams/classdiagram/ClassDiagram";
import Dexie from 'dexie';

declare global {
    interface Window {
        store: {
            onlineide: Dexie.Table;
        };
    }
}

export class EmbeddedIndexedDB {
    private db: Dexie.Table;

    public open(successCallback: () => void) {
        try {
            // Access the existing Dexie table
            this.db = window.store.onlineide;
            
            // Verify the table is available and ready
            if (this.db) {
                // Dexie table is already initialized, just call the callback
                successCallback();
            } else {
                console.log("Dexie table not available at window.store.onlineide");
            }
        } catch (error) {
            console.log("Couldn't access Dexie table: " + error);
        }
    }

    public writeScript(scriptId: string, script: string) {
        this.db.put({
            scriptId: scriptId,
            script: script
        }).catch(error => {
            console.error("Error writing script: ", error);
        });
    }

    public removeScript(scriptId: string) {
        this.db.delete(scriptId).catch(error => {
            console.error("Error removing script: ", error);
        });
    }

    public getScript(scriptId: string, callback: (script: string) => void) {
        this.db.get(scriptId)
            .then(result => {
                if (result == null) {
                    callback(null);
                } else {
                    callback(result.script);
                }
            })
            .catch(error => {
                console.error("Error getting script: ", error);
                callback(null);
            });
    }
}
