import { AppView } from "./AppView.js";
import { PdfReaderComponent } from "../../PdfReaderComponent.js";
import { NavbarComponent } from "../../NavbarComponent.js";

/**
 * PDF reader page view.
 *
 * @extends AppView
 * @property {PdfReaderComponent} reader static property representhing the PDF file reader component
 * @property {HTMLElement} component element representing the reader view
 */
class ReaderView extends AppView {
  static reader = new PdfReaderComponent();
  static navbar = new NavbarComponent();
  component = document.getElementById("pdf-viewer");
}

export { ReaderView };
