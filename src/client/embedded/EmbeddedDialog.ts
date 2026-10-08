import jQuery from "jquery";
import { EmbeddedMessages } from "./EmbeddedMessages";

/**
 * A dialog over the IDE: a heading with a close button on a dimmed backdrop.
 *
 * It lives inside the IDE's own div rather than in the page, so that it is
 * painted in the IDE's colours (the theme sets its custom properties there) and
 * so that an IDE embedded in somebody else's page cannot cover that page over.
 * Escape, the close button and a click beside the dialog close it.
 */
export function showEmbeddedDialog($outerDiv: JQuery<HTMLElement>, heading: string, extraClass: string):
    { $panel: JQuery<HTMLElement>, close: () => void } {

    // one at a time, however often a button is pressed
    $outerDiv.find('.joe_dialogBackdrop').remove();

    let $backdrop = jQuery('<div class="joe_dialogBackdrop"></div>');
    let $panel = jQuery('<div class="joe_dialog" tabindex="-1"></div>').addClass(extraClass);

    let $heading = jQuery('<div class="joe_dialogHeading"></div>');
    $heading.append(jQuery('<div></div>').text(heading));
    // a plain "times" rather than one of the icon classes: none of them reads as
    // "close", and the icons are a fixed colour while this follows the theme
    let $close = jQuery('<div class="joe_dialogClose"></div>').text("✕");
    $close.attr('title', EmbeddedMessages.DialogClose());
    $heading.append($close);
    $panel.append($heading);

    let close = () => {
        jQuery(document).off('keydown', onKey);
        $backdrop.remove();
    };
    let onKey = (event: JQuery.KeyDownEvent) => {
        if (event.key == "Escape") close();
    };

    $close.on('click', close);
    // a click beside the dialog closes it, one inside it does not
    $backdrop.on('click', close);
    $panel.on('click', event => event.stopPropagation());
    jQuery(document).on('keydown', onKey);

    $backdrop.append($panel);
    $outerDiv.append($backdrop);
    $panel.trigger('focus');

    return { $panel, close };
}
