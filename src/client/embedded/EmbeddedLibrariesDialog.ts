import jQuery from "jquery";
import type { LibraryData } from "../../compiler/common/programminglanguage/LibraryManager";
import { showEmbeddedDialog } from "./EmbeddedDialog";
import { EmbeddedMessages } from "./EmbeddedMessages";

/**
 * The dialog behind the libraries button: one checkbox per class library the
 * language offers. Every change is handed to onChange at once, with the ids of
 * all libraries ticked, in the order the libraries are listed.
 */
export function showLibrariesDialog($outerDiv: JQuery<HTMLElement>, libraries: LibraryData[], selected: string[],
    onChange: (selected: string[]) => void) {

    let { $panel } = showEmbeddedDialog($outerDiv, EmbeddedMessages.LibrariesHeading(), 'joe_librariesDialog');
    $panel.append(jQuery('<div class="joe_dialogIntro"></div>').text(
        libraries.length > 0 ? EmbeddedMessages.LibrariesIntro() : EmbeddedMessages.LibrariesNone()));

    let checkboxes: { library: LibraryData, $checkbox: JQuery<HTMLElement> }[] = [];
    for (let library of libraries) {
        let $option = jQuery('<label class="joe_libraryOption"></label>');
        let $checkbox = jQuery('<input type="checkbox">').prop('checked', selected.includes(library.id));
        let $text = jQuery('<div></div>');
        let $name = jQuery('<div class="joe_libraryName"></div>').text(library.identifier)
            .append(jQuery('<span class="joe_libraryId"></span>').text(library.id));
        $text.append($name, jQuery('<div class="joe_libraryDescription"></div>').text(library.description));
        $option.append($checkbox, $text);
        $panel.append($option);
        checkboxes.push({ library, $checkbox });
    }

    for (let { $checkbox } of checkboxes) {
        $checkbox.on('change', () => {
            onChange(checkboxes.filter(c => c.$checkbox.prop('checked')).map(c => c.library.id));
        });
    }
}
