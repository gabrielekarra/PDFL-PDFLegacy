import {
  EventHandlerService,
  PDFLEvents,
} from "../services/EventHandlerService";

/**
 * Used for marking the text that can be highlighted.
 */
const TOPIC_HIGHLIGHTED_TEXT_CLASS = "topic-highlighted-text";
/**
 * Used for turning the highlight on/off.
 */
const TOPIC_HIGHLIGHT_ACTIVE_CLASS = "topic-highlighted";

/**
 * Listens for 'onTextLayerRendered' events and highlights the text using some keywords.
 * Sentences that should be highlighted are marked by 'span' html elements with class
 * 'topic-highlighted-text'.
 *
 * Class 'topic-highlighted' actually contains css that highlights them.
 * 2 classes are used so highlighting can be turned off.
 *
 * @property {String[]} keywords a list of keywords that are going to be used for
 *  highlighting
 * @property {bool} on flag which is going to be used to check whether to highlight
 *  the appropriate sentences
 */
class KeywordHighlighterComponent {
  constructor() {
    this.keywords = [];
    this.on = false;

    this.#registerEvents();
  }

  /**
   * Sets the keywords that the highlighting is going to use.
   *
   * @param {String[]} keywords
   */
  setKeywords(keywords) {
    this.keywords = keywords;
  }

  /**
   * Shows the highlited sentences, text layers processed next will have their
   * highlited sentences turned on by default.
   */
  turnOn() {
    this.on = true;
    let highlightedTexts = document.querySelectorAll(
      `.${TOPIC_HIGHLIGHTED_TEXT_CLASS}`
    );
    highlightedTexts.forEach((highlightedText) => {
      highlightedText.classList.add(TOPIC_HIGHLIGHT_ACTIVE_CLASS);
    });
  }

  /**
   * Hides the highlited sentences, text layers processed next will have their
   * highlited sentences turned off by default.
   */
  turnOff() {
    this.on = false;
    let highlightedTexts = document.querySelectorAll(
      `.${TOPIC_HIGHLIGHTED_TEXT_CLASS}`
    );
    highlightedTexts.forEach((highlightedText) => {
      highlightedText.classList.remove(TOPIC_HIGHLIGHT_ACTIVE_CLASS);
    });
  }

  /**
   * Registers for 'onTextLayerRendered' events to process the rendered text layer
   * and inject HTML to highlight the sentences.
   */
  #registerEvents() {
    EventHandlerService.subscribe(
      PDFLEvents.onTextLayerRendered,
      this.#onTextLayerRendered.bind(this)
    );
  }

  /**
   * Takes a text layer generated by pdf.js library, processes it by injecting
   * HTML spans to sentences that need to be highlighted.
   *
   * Text layer consists of a list of spans called 'presentations'. Presentations
   * are span elements containing text. There is no rule for how long the text is
   * going to be in these presentations, or where the end of the sentence is.
   *
   * This function goes through all the child 'presentations' and if one contains
   * a keyword, it will delegate work to other helper functions for injecting HTML
   * span elements around text that needs to be highlighted.
   *
   * @param {HTMLElement} textLayer
   */
  #onTextLayerRendered(textLayer) {
    for (let currentPresentation of textLayer.children) {
      if (currentPresentation.tagName == "SPAN") {
        let content = currentPresentation.innerHTML;
        for (let keyword of this.keywords) {
          let keywordIndex = content.indexOf(keyword);
          if (keywordIndex != -1) {
            let dotIndex = currentPresentation.innerHTML.indexOf(". ");
            if (dotIndex == -1) {
              this.#highlightUntilLeftDot(currentPresentation);
              this.#highlightUntilRightDot(
                currentPresentation.nextElementSibling
              );
            } else {
              if (keywordIndex > dotIndex) {
                this.#highlightToLeftDot(currentPresentation);
                this.#highlightUntilRightDot(
                  currentPresentation.nextElementSibling
                );
              } else {
                this.#hightlightToRightDot(currentPresentation);
                this.#highlightUntilLeftDot(
                  currentPresentation.previousElementSibling
                );
              }
            }
          }
        }
      }
    }
  }

  /**
   * Highlights the whole presentation.
   *
   * @param {String} currentPresentation
   */
  #hightlightWholePresentation(currentPresentation) {
    currentPresentation.innerHTML = "<span>" + currentPresentation.innerHTML;
    currentPresentation.innerHTML += "</span>";

    this.#setHighlight(currentPresentation);
  }

  /**
   * Highlights the presentation to the right dot.
   *
   * @param {String} currentPresentation
   */
  #hightlightToRightDot(currentPresentation) {
    if (currentPresentation.innerHTML.includes("<span>")) {
      return;
    }
    currentPresentation.innerHTML = "<span>" + currentPresentation.innerHTML;

    let dotIndex = currentPresentation.innerHTML.indexOf(". ");
    currentPresentation.innerHTML =
      currentPresentation.innerHTML.slice(0, dotIndex) +
      "</span>" +
      currentPresentation.innerHTML.slice(dotIndex);

    this.#setHighlight(currentPresentation);
  }

  /**
   * Highlights the presentation to the left dot.
   *
   * @param {String} currentPresentation
   */
  #highlightToLeftDot(currentPresentation) {
    if (currentPresentation.innerHTML.includes("</span>")) {
      return;
    }
    let dotIndex = currentPresentation.innerHTML.indexOf(". ");
    currentPresentation.innerHTML =
      currentPresentation.innerHTML.slice(0, dotIndex + 2) +
      "<span>" +
      currentPresentation.innerHTML.slice(dotIndex + 2);
    currentPresentation.innerHTML += "</span>";

    this.#setHighlight(currentPresentation);
  }

  /**
   * Highlights the current presentation to the left dot, or if it does not
   * include the dot, recursively highlights the left presentations until it
   * finds the dot. (end of sentence)
   *
   * @param {String} currentPresentation
   */
  #highlightUntilLeftDot(currentPresentation) {
    // begining of text layer guard
    if (!currentPresentation) {
      return;
    }
    //skip elements that are not 'span', sometimes there are 'br' elements
    if (currentPresentation.tagName != "SPAN") {
      this.#highlightUntilLeftDot(currentPresentation.previousElementSibling);
      return;
    }

    let dotIndex = currentPresentation.innerHTML.indexOf(". ");
    if (dotIndex == -1) {
      this.#hightlightWholePresentation(currentPresentation);

      this.#highlightUntilLeftDot(currentPresentation.previousElementSibling);
    } else {
      this.#highlightToLeftDot(currentPresentation);
    }
  }

  /**
   * Highlights the current presentation to the right dot, or if it does not
   * include the dot, recursively highlights the right presentations until it
   * finds the dot. (end of sentence)
   *
   * @param {String} currentPresentation
   */
  #highlightUntilRightDot(currentPresentation) {
    // end of text layer guard
    if (!currentPresentation) {
      return;
    }
    //skip elements that are not 'span', sometimes there are 'br' elements
    if (currentPresentation.tagName != "SPAN") {
      this.#highlightUntilRightDot(currentPresentation.nextElementSibling);
      return;
    }

    let dotIndex = currentPresentation.innerHTML.indexOf(". ");
    if (dotIndex == -1) {
      this.#hightlightWholePresentation(currentPresentation);

      this.#highlightUntilRightDot(currentPresentation.nextElementSibling);
    } else {
      this.#hightlightToRightDot(currentPresentation);
    }
  }

  /**
   * Sets the height of the highlight (because the height of presentation is
   * inconsistent). If the topic-specific highlight is turned on, it activates
   * the hightlight by adding thr 'topic-highlighted' class to the text.
   *
   * @param {String} currentPresentation
   */
  #setHighlight(currentPresentation) {
    let newHighlight = currentPresentation.children[0];
    newHighlight.classList.add(TOPIC_HIGHLIGHTED_TEXT_CLASS);
    newHighlight.style.height = currentPresentation.style.fontSize;
    newHighlight.style.position = "relative";
    if (this.on) {
      newHighlight.classList.add(TOPIC_HIGHLIGHT_ACTIVE_CLASS);
    }
  }
}

export { KeywordHighlighterComponent };
