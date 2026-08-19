import { lm } from "../../tools/language/LanguageManager";

export class EmbeddedMessages {

    static NewFileName = () => lm({
    "de": "Neue Datei",
    "en": "new file",
    })

    static ShareWorkspaceTooltip = () => lm({
    "de": "Workspace teilen: als Link speichern",
    "en": "Share workspace: save it as a link",
    })

    static ShareWorkspaceUploading = () => lm({
    "de": "Der Workspace wird hochgeladen …",
    "en": "Uploading the workspace …",
    })

    static ShareWorkspaceDone = () => lm({
    "de": "Der Workspace wurde gespeichert. Über diesen Link kann er geöffnet werden:",
    "en": "The workspace has been saved. This link opens it:",
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

    static URLParametersClose = () => lm({
    "de": "Schließen",
    "en": "Close",
    })

}
