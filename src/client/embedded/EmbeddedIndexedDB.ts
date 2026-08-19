import { ClassDiagram } from "../main/gui/diagrams/classdiagram/ClassDiagram";
import Dexie from "dexie";

declare global {
  interface Window {
    hyperbook: {
      store: {
        db: {
          onlineide: Dexie.Table;
        };
      };
    };
  }
}

export class EmbeddedIndexedDB {
  private db: Dexie.Table;

  /** The database the IDE keeps for itself where there is no hyperbook to lend it one. */
  private static openOwnDatabase(): Dexie.Table {
    const db = new Dexie("OnlineIDE");
    db.version(1).stores({ scripts: "scriptId" });
    return db.table("scripts");
  }

  public open(successCallback: () => void) {
    try {
      // In a hyperbook the scripts belong with the rest of the book's state, so
      // the IDE writes into the table the book already keeps for it.
      this.db = window.hyperbook?.store?.db?.onlineide;
    } catch (error) {
      // a window.hyperbook that is not the one we know about is no hyperbook
    }

    if (!this.db) {
      // On a page of its own - the playground, any plain embedded page - there is
      // no such table, and the IDE opens a database for itself, as it did before
      // it learned about hyperbook. Without this the caching silently does
      // nothing: `open` would never call back, so nothing was ever read or saved.
      try {
        this.db = EmbeddedIndexedDB.openOwnDatabase();
      } catch (error) {
        console.log("Couldn't open an IndexedDB for the cached scripts: " + error);
        return;
      }
    }

    successCallback();
  }

  public writeScript(scriptId: string, script: string) {
    this.db
      .put({
        scriptId: scriptId,
        script: script,
      })
      .catch((error) => {
        console.error("Error writing script: ", error);
      });
  }

  public removeScript(scriptId: string) {
    this.db.delete(scriptId).catch((error) => {
      console.error("Error removing script: ", error);
    });
  }

  public getScript(scriptId: string, callback: (script: string) => void) {
    this.db
      .get(scriptId)
      .then((result) => {
        if (result == null) {
          callback(null);
        } else {
          callback(result.script);
        }
      })
      .catch((error) => {
        console.error("Error getting script: ", error);
        callback(null);
      });
  }
}
