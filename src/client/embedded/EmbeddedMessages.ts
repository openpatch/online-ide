import { lm } from "../../tools/language/LanguageManager";

export class EmbeddedMessages {
    static Export = () => lm({ de: 'Exportieren', en: 'Export' });
    static ExportHeading = () => lm({ de: 'Projekt exportieren', en: 'Export project' });
    static ExportLocalTitle = () => lm({ de: 'Als ZIP exportieren (auch für lokale IDEs geeignet)', en: 'Export as ZIP (also suited for local IDEs)' });
    static ExportLocalDescription = () => lm({
        de: 'Speichert alle Dateien des Projekts und die Bilder, die das Programm lädt, als ZIP-Datei. Sie lässt sich hier über „Öffnen“, in der Online-IDE über „Workspace importieren“ oder in einer lokalen IDE öffnen.',
        en: 'Saves all files of the project and the images the program loads as a ZIP file. It can be opened here with “Open”, in the Online-IDE with “Import workspace” or in a local IDE.' });
    static ExportLocalButton = () => lm({ de: 'Als ZIP speichern', en: 'Save as ZIP' });
    static ExportLocalPreparing = () => lm({ de: 'Die Datei wird zusammengestellt …', en: 'Putting the file together …' });
    static ExportJsonTitle = () => lm({ de: 'Als Workspace-Datei speichern (JSON)', en: 'Save as workspace file (JSON)' });
    static ExportJsonDescription = () => lm({
        de: 'Speichert den Workspace als JSON-Datei. Sie lässt sich hier über „Öffnen“ oder in der Online-IDE über „Workspace importieren“ wieder laden.',
        en: 'Saves the workspace as a JSON file. It can be loaded again here with “Open” or in the Online-IDE with “Import workspace”.' });
    static ExportJsonButton = () => lm({ de: 'Als JSON speichern', en: 'Save as JSON' });
    static ExportLocalDone = (name: string) => lm({ de: `${name} wurde gespeichert.`, en: `${name} has been saved.` });
    static ProjectFilename = () => lm({ de: 'Dateiname', en: 'File name' });
    static ExportLinkTitle = () => lm({ de: 'Als Link speichern', en: 'Save as link' });
    static ExportLinkDescription = () => lm({
        de: 'Lädt das Projekt hoch. Der Link öffnet es wieder, mit denselben Einstellungen wie diese Seite.',
        en: 'Uploads the project. The link opens it again, with the same settings as this page.' });
    static ExportLinkButton = () => lm({ de: 'Link erstellen', en: 'Create link' });
    static ExportCopyButton = () => lm({ de: 'Kopieren', en: 'Copy' });
    static ImportProject = () => lm({ de: 'Workspace-JSON oder Projekt-ZIP öffnen', en: 'Open workspace JSON or project ZIP' });
    static ProjectAssetsMissing = () => lm({ de: 'Diese Dateien nennt das Programm, sie konnten aber nicht ins Projekt-ZIP übernommen werden:', en: 'The program names these files, but they could not be added to the project ZIP:' });
    static ProjectFailed = () => lm({ de: 'Das Projekt konnte nicht übertragen werden:', en: 'The project could not be transferred:' });

    static UploadAsset = () => lm({
    "de": "Bilddatei hochladen",
    "en": "Upload image asset",
    })

    static AssetAlreadyExists = (filename: string) => lm({
    "de": `Eine Datei namens ${filename} existiert bereits.`,
    "en": `A file named ${filename} already exists.`,
    })

    static NewFileName = () => lm({
    "de": "Neue Datei",
    "en": "new file",
    })

    static ShareWorkspaceUploading = () => lm({
    "de": "Der Workspace wird hochgeladen …",
    "en": "Uploading the workspace …",
    })

    static ShareWorkspaceDone = () => lm({
    "de": "Das Projekt wurde hochgeladen. Dieser Link öffnet es:",
    "en": "The project has been uploaded. This link opens it:",
    })

    static ShareWorkspaceCopied = () => lm({
    "de": "Link kopiert",
    "en": "Link copied",
    })

    static ShareWorkspaceFailed = () => lm({
    "de": "Beim Hochladen ist etwas schief gegangen. Bitte versuche es noch einmal.",
    "en": "Something went wrong while uploading. Please try again.",
    })

    static LoadSharedWorkspaceFailed = () => lm({
    "de": "Der geteilte Workspace konnte nicht geladen werden. Bitte überprüfe den Link.",
    "en": "The shared workspace could not be loaded. Please check the link.",
    })

    static URLParametersTooltip = () => lm({
    "de": "Welche Einstellungen der Link mitgeben kann",
    "en": "Which settings the link can carry",
    })

    static URLParametersHeading = () => lm({
    "de": "Einstellungen im Link",
    "en": "Settings in the link",
    })

    static URLParametersIntro = () => lm({
    "de": "An die Adresse dieser Seite lassen sich Parameter anhängen, z.B. ?libraries=scratch&theme=light. Hervorgehoben ist, was dieser Link sagt.",
    "en": "Parameters can be appended to this page's address, e.g. ?libraries=scratch&theme=light. What this link says is highlighted.",
    })

    static URLParametersShareHint = () => lm({
    "de": "Der Teilen-Knopf hängt zusätzlich #json=… an: davor steht, wie die IDE aussieht, dahinter, was darin steht.",
    "en": "The share button appends #json=… as well: before it stands what the IDE looks like, after it what is in it.",
    })

    static URLParametersColumnName = () => lm({
    "de": "Parameter",
    "en": "Parameter",
    })

    static URLParametersColumnValues = () => lm({
    "de": "Werte",
    "en": "Values",
    })

    static URLParametersColumnMeaning = () => lm({
    "de": "Bedeutung",
    "en": "Meaning",
    })

    static DialogClose = () => lm({
    "de": "Schließen",
    "en": "Close",
    })

}
