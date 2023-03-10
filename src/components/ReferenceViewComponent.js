import {
  EventHandlerService,
  PDFLEvents,
} from "../services/EventHandlerService";
import * as textRenderService from "../services/TextRenderService";

/**
 * Component representing the page containing the cross reference content. Content
 * dynamically changes when new cross reference is opened. This component is displayed
 * as a page next to current page of PDF that user is reading.
 * @property {Object} components object that holds DOM elements that represent this component
 * @property {HTMLElement} components.pdfContainer PDF reader container
 * @property {HTMLElement} components.canvas canvas containing the whole page where reference is
 * @property {HTMLElement} components.closeBtn button that closes this component
 * @property {HTMLElement} components.container placeholder of this whole component
 * @property {HTMLElement} pdfDoc PDF document that is currently being read
 */

class ReferenceViewComponent {
  components = {
    pdfContainer: document.querySelector("#pdf-container"),
    canvas: document.querySelector("#reference-canvas"),
    closeBtn: document.querySelector("#reference-close-btn"),
    container: document.querySelector("#reference-container"),
  };

  /**
   * Creates new ReferenceViewComponent object and registers events to it.
   * @constructor
   */
  constructor() {
    this.#registerEvents();
  }

  /**
   * Adds event listeners to component and it's elements.
   * @private
   */
  #registerEvents = () => {
    EventHandlerService.subscribe(
      PDFLEvents.onReferencePdfOpen,
      (pageNumber) => {
        this.#displayPdfReference(pageNumber);
      }
    );

    this.components.closeBtn.addEventListener("click", () => {
      this.#hidePdfReference();
    });

    EventHandlerService.subscribe(PDFLEvents.onSidePageDisplayed, () => {
      this.#hidePdfReference(false);
    });

    EventHandlerService.subscribe(PDFLEvents.onReadNewPdf, (pdf) => {
      this.#setPDF(pdf);
    });

    EventHandlerService.subscribe(PDFLEvents.onResetReader, () => {
      this.#hidePdfReference();
    });

    this.#positionTextLayerOnWindowResize();
  };

  /**
   * Opens new side page and sets it's content to page where reference is.
   * @private
   * @param {int} pageNumber number of page where reference is
   */
  #displayPdfReference = (pageNumber) => {
    this.#renderPdfReference(pageNumber);
    this.#showPdfReference();
  };

  /**
   * Renders the reference page inside this component.
   * @private
   * @async
   * @param {int} pageNumber number of page where reference is
   */
  #renderPdfReference = async (pageNumber) => {
    const page = await this.pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({
      scale: 1,
    });

    textRenderService.renderPageReference(
      page,
      pageNumber,
      this.components.canvas,
      this.components.container,
      viewport
    );

    this.#setCanvasDimensions(viewport.height, viewport.width);
    this.#positionCloseButton(viewport.width);
  };

  /**
   * Sets hight and width of canvas inside this component
   * to given hight and width.
   * @private
   * @param {int} height height to be set
   * @param {int} width width to be set
   */
  #setCanvasDimensions = (height, width) => {
    this.components.canvas.height = height;
    this.components.canvas.width = width;
  };

  /**
   * Positions the close button left outside of canvas.
   * @param {int} offset width of canvas
   */
  #positionCloseButton = (offset) => {
    const halfButtonWidth = 25;
    this.components.closeBtn.style.right = offset + halfButtonWidth + "px";
  };

  /**
   * Displays this component in half of reader view.
   * @private
   */
  #showPdfReference = () => {
    this.components.pdfContainer.className = "half-width";
    this.components.container.classList.remove("hidden");
  };

  /**
   * Hides this component and displays reader in full width (default reader view)
   * or half width which depends isDefaultReaderDisplay parameter.
   * @private
   * @param {boolean} isDefaultReaderDisplay if true (default) reader will be displayed
   * in full width and half width otherwise
   */
  #hidePdfReference = (isDefaultReaderDisplay = true) => {
    this.components.container.classList.add("hidden");
    this.components.pdfContainer.className = isDefaultReaderDisplay
      ? "full-width"
      : "half-width";
  };

  /**
   * Sets the PDF document.
   * @private
   * @param {PDFDocumentProxy} pdfDocument PDF document
   */
  #setPDF = (pdfDoc) => {
    this.pdfDoc = pdfDoc;
  };

  /**
   * Positions a text layer when window is being resized.
   * @private
   */
  #positionTextLayerOnWindowResize() {
    const self = this;
    window.onresize = function () {
      const textLayer = self.components.container.querySelector("#text-layer-reference");
      if (textLayer)
        textRenderService.positionTextLayer(textLayer, self.components.canvas);
    };
  }
}

export { ReferenceViewComponent };
