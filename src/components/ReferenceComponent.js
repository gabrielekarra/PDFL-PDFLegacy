import {EventHandlerService, PDFLEvents} from "../services/EventHandlerService";
import { mouseOverDelayEvent } from "../services/Utils";
import {ImageExtractorService} from "../services/DocumentParser/ImageExtractorService";
import { TextExtractorService } from "../services/DocumentParser/TextExtractorService";
import {ExternalCitationExtractorService} from "../services/DocumentParser/ExternalCitationExtractorService";
import {TableExtractorService} from "../services/DocumentParser/TableExtractorService";

/**
 * This class handles user interaction with internal document references
 * @property {object} pdfDocument
 */
class ReferenceComponent {

  /**
   * @constructor
   * Subscribes to an event to be notified when links are available in dom
   */
  constructor() {
    this.pdfDoc = null;
    EventHandlerService.subscribe(PDFLEvents.onLinkLayerRendered, this.#onLinkLayerRendered.bind(this));
  }

  /**
   * Set the pdf document
   * @param pdfDoc
   */
  setPdfDoc = (pdfDoc) => {
    this.pdfDoc = pdfDoc;
  }

  /**
   * @private
   * Get the a tags from the DOM and add the event listener both for click and onMouseOver with delay
   */
  #onLinkLayerRendered = () => {
    if(this.pdfDoc === null){ throw new Error('PDFDocument object missed'); }
    const pageHref = document.getElementsByClassName('internalLink');
    for (var i = 0; i < pageHref.length; i++) {
      const aElem = pageHref.item(i);
      aElem.addEventListener('click', this.#onInternalReferenceClick.bind(this));
      mouseOverDelayEvent(aElem, 2000, this.#onInternalReferenceOver.bind(this)); //Delay the over listener
    }
  }

  /**
   * Function for handling the onClick event of a reference
   * Solve the reference and publish and event to require the page change
   * @param event
   */
  #onInternalReferenceClick = (event) => {
    const self = this;
    event.preventDefault();
    const target = event.target.closest('a');
    if (!target) return;
    const reference = target.getAttribute('href').replace('#', '');
    self.#solveReference(reference).then(pageNumber => {
      EventHandlerService.publish(PDFLEvents.onNewPageRequest, pageNumber);
    });
  };

  /**
   * Function for handling the onMouseOver event of a reference
   * @param event
   */
  #onInternalReferenceOver = (event) => {
    const self = this;
    event.preventDefault();
    const target = event.target.closest('a');
    if (!target) return;
    const reference = target.getAttribute('href').replace('#', '');
    self.#solveReference(reference).then(pageNumber => {
      self.#parseReference(reference, pageNumber);
    });
  };

  /**
   * Given ad id the function return a promise with the correct page number of the reference
   * @param refId the reference ID from the dom
   * @returns {Promise<number>}
   */
  #solveReference = async (refId) => {
    const self = this;
    const destinationObject = await self.pdfDoc.getDestination(refId);
    const pageIndex = await self.pdfDoc.getPageIndex(destinationObject[0])
    return pageIndex + 1;
  }

  /**
   * Call the correct parser and rise ad event to notify that popup content is ready
   * @param reference the reference from the dom
   * @param pageNumber the solved page number
   */
  #parseReference = (reference, pageNumber) => {
    const self = this;
    const referenceType = reference.split('.')[0];
    var parseService = undefined;
    switch (referenceType) {
      case 'figure':
        parseService = new ImageExtractorService(self.pdfDoc, pageNumber, reference);
        break;
      case 'section':
      case 'subsection':
      case 'subsubsection':
        parseService = new TextExtractorService(self.pdfDoc, pageNumber, reference);
        break;
      case 'cite':
        parseService = new ExternalCitationExtractorService(self.pdfDoc, pageNumber, reference);
        break;
      case 'table':
        parseService = new TableExtractorService(self.pdfDoc, pageNumber, reference);
        break;
      default:
        throw new Error("Parser not implemented exception for type " + referenceType);
    }
    parseService.getContent().then(result => {
      EventHandlerService.publish(PDFLEvents.onPopupContentReady, result);
    });
  }

}

export {ReferenceComponent};