import jQuery from "jquery";
import { showEmbeddedDialog } from "./EmbeddedDialog";
import { EmbeddedMessages } from "./EmbeddedMessages";

export type ExportActions = {
    defaultZipName: string,
    /** saves the ZIP under that name; resolves to the paths it could not take along */
    saveZip: (name: string) => Promise<string[]>,
    defaultJsonName: string,
    /** saves the workspace as JSON under that name */
    saveJson: (name: string) => Promise<void>,
    /** uploads the project and resolves to the link; missing where there is no store */
    createLink?: () => Promise<string>,
};

/**
 * The dialog behind the export button: the project as a ZIP for a local IDE,
 * as a workspace JSON file or as a link. Progress, results and errors are shown
 * in the dialog itself.
 */
export function showExportDialog($outerDiv: JQuery<HTMLElement>, actions: ExportActions) {

    let { $panel } = showEmbeddedDialog($outerDiv, EmbeddedMessages.ExportHeading(), 'joe_exportDialog');

    $panel.append(makeFileOption({
        title: EmbeddedMessages.ExportLocalTitle(), icon: 'img_export-dark', description: EmbeddedMessages.ExportLocalDescription(),
        buttonText: EmbeddedMessages.ExportLocalButton(), defaultName: actions.defaultZipName, extension: '.zip',
        save: actions.saveZip,
    }));
    $panel.append(makeFileOption({
        title: EmbeddedMessages.ExportJsonTitle(), icon: 'img_save-dark', description: EmbeddedMessages.ExportJsonDescription(),
        buttonText: EmbeddedMessages.ExportJsonButton(), defaultName: actions.defaultJsonName, extension: '.json',
        save: async name => { await actions.saveJson(name); return []; },
    }));
    if (actions.createLink) $panel.append(makeLinkOption(actions.createLink));
}

function makeOption(title: string, icon: string, description: string) {
    let $option = jQuery('<div class="joe_exportOption"></div>');
    let $title = jQuery('<div class="joe_exportOptionTitle"></div>');
    $title.append(jQuery(`<span class="${icon}"></span>`), jQuery('<span></span>').text(title));
    let $status = jQuery('<div class="joe_exportStatus"></div>');
    $option.append($title, jQuery('<div class="joe_exportOptionDescription"></div>').text(description));
    let showStatus = (text: string, isError: boolean = false) => {
        $status.text(text).toggleClass('joe_exportStatusError', isError);
    };
    return { $option, $status, showStatus };
}

type FileOption = {
    title: string, icon: string, description: string, buttonText: string,
    defaultName: string, extension: string,
    /** saves the file under that name; resolves to the paths it could not take along */
    save: (name: string) => Promise<string[]>,
};

/** A way out as a file: its name, a save button, and what came of it. */
function makeFileOption(option: FileOption) {
    let { $option, $status, showStatus } = makeOption(option.title, option.icon, option.description);

    let $name = jQuery('<input type="text" spellcheck="false">')
        .val(option.defaultName).attr('aria-label', EmbeddedMessages.ProjectFilename())
        .attr('title', EmbeddedMessages.ProjectFilename());
    let $button = jQuery('<button type="button" class="joe_exportButton"></button>').text(option.buttonText);

    let save = async () => {
        let name = ((<string>$name.val()) || "").trim() || option.defaultName;
        if (!name.toLowerCase().endsWith(option.extension)) name += option.extension;
        $button.prop('disabled', true);
        showStatus(EmbeddedMessages.ExportLocalPreparing());
        try {
            let lost = await option.save(name);
            showStatus(EmbeddedMessages.ExportLocalDone(name) +
                (lost.length ? "\n" + EmbeddedMessages.ProjectAssetsMissing() + "\n" + lost.join("\n") : ""), lost.length > 0);
        } catch (error) {
            showStatus(EmbeddedMessages.ProjectFailed() + " " + error.message, true);
        } finally {
            $button.prop('disabled', false);
        }
    };

    $button.on('click', save);
    $name.on('keydown', event => { if (event.key == "Enter") save(); });

    $option.append(jQuery('<div class="joe_exportRow"></div>').append($name, $button), $status);
    $status.css('white-space', 'pre-line');
    return $option;
}

function makeLinkOption(createLink: () => Promise<string>) {
    let { $option, $status, showStatus } = makeOption(EmbeddedMessages.ExportLinkTitle(), 'img_copy-dark',
        EmbeddedMessages.ExportLinkDescription());

    let $button = jQuery('<button type="button" class="joe_exportButton"></button>').text(EmbeddedMessages.ExportLinkButton());
    let $linkRow = jQuery('<div class="joe_exportRow"></div>').hide();
    let $link = jQuery('<input type="text" readonly spellcheck="false">');
    let $copy = jQuery('<button type="button" class="joe_exportButton"></button>').text(EmbeddedMessages.ExportCopyButton());
    $linkRow.append($link, $copy);

    let $buttonRow = jQuery('<div class="joe_exportRow"></div>').append($button);

    // the clipboard is not always allowed; the selected link can then be copied by hand
    let copy = async (): Promise<boolean> => {
        let copied = await navigator.clipboard?.writeText(<string>$link.val()).then(() => true, () => false);
        ($link[0] as HTMLInputElement).select();
        return !!copied;
    };

    $button.on('click', async () => {
        $button.prop('disabled', true);
        showStatus(EmbeddedMessages.ShareWorkspaceUploading());
        try {
            $link.val(await createLink());
            $linkRow.show();
            $buttonRow.hide();
            let copied = await copy();
            showStatus(EmbeddedMessages.ShareWorkspaceDone() + (copied ? " (" + EmbeddedMessages.ShareWorkspaceCopied() + ")" : ""));
        } catch (error) {
            console.error(error);
            showStatus(EmbeddedMessages.ShareWorkspaceFailed(), true);
        } finally {
            $button.prop('disabled', false);
        }
    });
    $copy.on('click', async () => {
        if (await copy()) showStatus(EmbeddedMessages.ShareWorkspaceCopied());
    });
    $link.on('focus', () => ($link[0] as HTMLInputElement).select());

    $option.append($buttonRow, $linkRow, $status);
    return $option;
}
