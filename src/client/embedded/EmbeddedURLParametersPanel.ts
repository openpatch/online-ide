import jQuery from "jquery";
import { EmbeddedMessages } from "./EmbeddedMessages";
import { URL_PARAMETERS, urlParameterValue } from "./EmbeddedURLConfig";
import { showEmbeddedDialog } from "./EmbeddedDialog";

/**
 * The panel behind the playground's "?" button: what may stand in the link, and
 * what this link says.
 */
export function showURLParametersPanel($outerDiv: JQuery<HTMLElement>) {

    let { $panel } = showEmbeddedDialog($outerDiv, EmbeddedMessages.URLParametersHeading(), 'joe_urlHelp');

    $panel.append(jQuery('<div class="joe_urlHelpIntro"></div>').text(EmbeddedMessages.URLParametersIntro()));

    let $table = jQuery('<table class="joe_urlHelpTable"></table>');
    let $head = jQuery('<tr></tr>');
    for (let caption of [EmbeddedMessages.URLParametersColumnName(),
    EmbeddedMessages.URLParametersColumnValues(),
    EmbeddedMessages.URLParametersColumnMeaning()]) {
        $head.append(jQuery('<th></th>').text(caption));
    }
    $table.append($head);

    for (let parameter of URL_PARAMETERS) {
        let value = urlParameterValue(parameter.name);
        let $row = jQuery('<tr></tr>');
        if (value !== undefined) $row.addClass('joe_urlHelpSet');

        let $name = jQuery('<td class="joe_urlHelpName"></td>');
        $name.append(jQuery('<code></code>').text(parameter.name));
        // what this very link says about it, so that the panel doubles as a
        // reading of the URL the reader arrived with
        if (value !== undefined) {
            $name.append(jQuery('<div class="joe_urlHelpValue"></div>').text("= " + value));
        }
        $row.append($name);

        $row.append(jQuery('<td class="joe_urlHelpValues"></td>').text(parameter.values));
        $row.append(jQuery('<td></td>').text(parameter.description()));
        $table.append($row);
    }
    $panel.append($table);

    $panel.append(jQuery('<div class="joe_urlHelpIntro"></div>').text(EmbeddedMessages.URLParametersShareHint()));
}
