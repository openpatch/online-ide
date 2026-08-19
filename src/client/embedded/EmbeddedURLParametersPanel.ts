import jQuery from "jquery";
import { EmbeddedMessages } from "./EmbeddedMessages";
import { URL_PARAMETERS, urlParameterValue } from "./EmbeddedURLConfig";

/**
 * The panel behind the playground's "?" button: what may stand in the link, and
 * what this link says.
 *
 * It lives inside the IDE's own div rather than in the page, so that it is
 * painted in the IDE's colours (the theme sets its custom properties there) and
 * so that an IDE embedded in somebody else's page cannot cover that page over.
 */
export function showURLParametersPanel($outerDiv: JQuery<HTMLElement>) {

    // one at a time, however often the button is pressed
    $outerDiv.find('.joe_urlHelpBackdrop').remove();

    let $backdrop = jQuery('<div class="joe_urlHelpBackdrop"></div>');
    let $panel = jQuery('<div class="joe_urlHelp" tabindex="-1"></div>');

    let $heading = jQuery('<div class="joe_urlHelpHeading"></div>');
    $heading.append(jQuery('<div></div>').text(EmbeddedMessages.URLParametersHeading()));
    // a plain "times" rather than one of the icon classes: none of them reads as
    // "close", and the icons are a fixed colour while this follows the theme
    let $close = jQuery('<div class="joe_urlHelpClose"></div>').text("\u2715");
    $close.attr('title', EmbeddedMessages.URLParametersClose());
    $heading.append($close);
    $panel.append($heading);

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

    let close = () => {
        jQuery(document).off('keydown', onKey);
        $backdrop.remove();
    };
    let onKey = (event: JQuery.KeyDownEvent) => {
        if (event.key == "Escape") close();
    };

    $close.on('click', close);
    // a click beside the panel closes it, one inside it does not
    $backdrop.on('click', close);
    $panel.on('click', event => event.stopPropagation());
    jQuery(document).on('keydown', onKey);

    $backdrop.append($panel);
    $outerDiv.append($backdrop);
    $panel.trigger('focus');
}
