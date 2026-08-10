/**
 * Which theme the page around an embedded IDE is in.
 *
 * Hyperbook — and anything else built on GoogleChromeLabs' `<dark-mode-toggle>`
 * — puts a toggle on the page and lets the reader choose. An IDE embedded in
 * such a page should be in the same colours as the text around it rather than a
 * dark rectangle in the middle of a light page, so where the page says which it
 * is, the IDE follows.
 *
 * The element carries the reader's choice in its `mode` property ("dark" or
 * "light") and announces changes with a `colorschemechange` event, which is all
 * this module reads. Nothing here falls back to prefers-color-scheme: the
 * toggle has already resolved that for the page it sits on, and a page without
 * a toggle has said nothing about its colours at all.
 */

const TOGGLE = "dark-mode-toggle";

export type PageTheme = "dark" | "light";

type ToggleElement = Element & { mode?: string };

function toggleElement(): ToggleElement | null {
    return document.querySelector<ToggleElement>(TOGGLE);
}

/**
 * The page's theme, or undefined where the page does not say.
 *
 * The property is read before the attribute because that is where the element
 * keeps the reader's choice; the attribute covers the moment before the custom
 * element has been upgraded, when the markup is on the page but its script has
 * not run yet.
 */
export function pageTheme(): PageTheme | undefined {
    const toggle = toggleElement();
    if (!toggle) return undefined;
    const mode = toggle.mode ?? toggle.getAttribute("mode");
    return mode == "dark" || mode == "light" ? mode : undefined;
}

/**
 * Report the page's theme whenever the reader changes it — and once as soon as
 * the toggle has been upgraded, because a toggle whose script loads after ours
 * has no `mode` to read at the time the IDE starts up.
 *
 * There is nothing to unsubscribe from: an embedded IDE lives as long as the
 * page it is written into.
 */
export function followPageTheme(onChange: (theme: PageTheme) => void): void {
    const toggle = toggleElement();
    if (!toggle) return;

    const report = () => {
        const theme = pageTheme();
        if (theme) onChange(theme);
    };

    toggle.addEventListener("colorschemechange", report);
    // stays pending forever on a page that never defines the element, which is
    // the same as never reporting - and the listener above never fires either
    customElements?.whenDefined(TOGGLE).then(report).catch(() => { });
}
