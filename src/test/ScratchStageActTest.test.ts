import { describe, expect, test } from 'vitest';
import { ScratchStageClass } from '../compiler/java/runtime/graphics/scratch/ScratchStageClass';
import { beginScratchStages, registerScratchStage } from '../compiler/java/runtime/graphics/scratch/ScratchStages';

/**
 * A stage goes on screen from its base constructor, so between that moment and
 * the end of `new MyStage()` there is an active stage whose fields the program
 * has not assigned yet. act() must not call run() until then.
 */

/** A stage that only counts how often its run() was reached. */
function stageUnterTest() {
    const stage = Object.create(ScratchStageClass.prototype) as any;
    stage.laeufe = 0;
    stage._mj$run$void$ = (_t: any, callback?: () => void) => { stage.laeufe++; if (callback) callback(); };
    stage._activate = () => { };
    stage._deactivate = () => { };
    stage._preRender = () => { };
    return stage;
}

describe('act() der Bühne', () => {
    test('ruft run() nicht, solange der Konstruktor läuft', () => {
        beginScratchStages({ width: 800, height: 400, app: { stage: { addChild: (c: any) => c } } } as any);
        const stage = stageUnterTest();
        registerScratchStage(stage);              // wie im Basiskonstruktor: kommt sofort auf den Schirm

        stage._mj$act$void$(undefined as any, undefined);
        expect(stage.laeufe).toBe(0);

        // Der Compiler meldet das Ende des Konstruktors.
        stage.listenersRegistered = true;
        stage._mj$act$void$(undefined as any, undefined);
        expect(stage.laeufe).toBe(1);
    });

    test('meldet den Rückruf auch im gesperrten Zustand zurück', () => {
        beginScratchStages({ width: 800, height: 400, app: { stage: { addChild: (c: any) => c } } } as any);
        const stage = stageUnterTest();
        registerScratchStage(stage);

        let zurueck = 0;
        stage._mj$act$void$(undefined as any, () => { zurueck++; });
        expect(zurueck).toBe(1);
        expect(stage.laeufe).toBe(0);
    });
});
