import { IconButtonComponent } from '../../tools/components/IconButtonComponent';
import { DOM } from '../../tools/DOM';
import { transferElements } from '../../tools/HtmlTools';
import { MainEmbedded } from './MainEmbedded';
import '/assets/css/wholewindow.css';


export class EmbeddedFullpageController {

    wholeWindowElement: HTMLElement;
    primaryButton: IconButtonComponent;
    additionalButtonTopRight: IconButtonComponent;

    constructor(private mainEmbedded: MainEmbedded, private mainDiv: HTMLElement, controlsDiv: HTMLElement) {
        this.primaryButton = new IconButtonComponent(controlsDiv,
            ['img_whole-window-dark', 'img_whole-window-back-dark'], (event, state) => {
                this.onWholeWindowButtonClicked(state);
            },
            ["IDE im Vollbild darstellen", "IDE in Normalgröße darstellen"],
            true, "append"
        )

        this.primaryButton.divElement.style.marginLeft = '10px';
        this.primaryButton.divElement.style.marginRight = '10px';
        

    }

    onWholeWindowButtonClicked(state: number) {
        switch (state) {
            case 0:
                // Leaving through the button in the top right corner does not
                // go through the toolbar button, which is what would otherwise
                // flip it back: it kept showing "leave fullscreen" and the next
                // click on it toggled to state 0 again, so once a reader had
                // been to fullscreen and back, the button did nothing.
                this.primaryButton.state = 0;
                this.mainEmbedded.rightDiv.wholeWindowButton.setVisible(true);
                this.mainEmbedded.horizontalSlider?.restorePosition();
                this.mainEmbedded.verticalSlider?.restorePosition();
                this.additionalButtonTopRight.remove();
                document.body.classList.remove('joeCssFence');
                this.mainEmbedded.themeManager.removeRootElement(this.wholeWindowElement);
                transferElements(this.wholeWindowElement, this.mainDiv);
                // the emptied container is still a fixed, full-window element:
                // left behind, every trip to fullscreen and back stacked another
                // one over the page
                this.wholeWindowElement.remove();
                break;
            case 1:
                this.additionalButtonTopRight = new IconButtonComponent(this.mainEmbedded.rightDiv.tabManager.tabheadingRightDiv,
                    ['img_whole-window-back'], (event, state) => {
                        this.onWholeWindowButtonClicked(0);
                    },
                    ["IDE in Normalgröße darstellen"],
                    true, "append"
                )
                this.mainEmbedded.rightDiv.wholeWindowButton.setVisible(false);
                this.mainEmbedded.horizontalSlider?.savePosition();
                this.mainEmbedded.verticalSlider?.savePosition();
                document.body.classList.add('joeCssFence');
                this.wholeWindowElement = DOM.makeDiv(document.body, 'jo_wholeWindow', 'jo_wholeWindow_embeddedFullpage');
                // it hangs off document.body, so it is outside the div this IDE
                // was themed on and has to be given the colours itself
                this.mainEmbedded.themeManager.addRootElement(this.wholeWindowElement);
                transferElements(this.mainDiv, this.wholeWindowElement);
                break;
        }
    }

}