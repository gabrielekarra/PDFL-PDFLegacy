import { EventHandlerService, PDFLEvents } from "../services/EventHandlerService";

class FileUploadComponent {

    components = {
        dropArea: document.getElementById("file-drag"),
        fileOpen: document.getElementById("fileOpen"),
    }

    /**
     * @constructor
     */
    constructor() {
        this.#registerEvents();
    }

    /**
     * Add event listeners to upload view
     */
     #registerEvents = () => {
        this.components.fileOpen.addEventListener('input', this.#onFileChange);
        this.components.dropArea.addEventListener('dragover', this.#onDragOver);
        this.components.dropArea.addEventListener('dragleave', this.#onDragLeave);
        this.components.dropArea.addEventListener('drop', this.#onDrop);
    }

    /**
     * Callback for file input
     * @param e
     */
    #onFileChange = (e) => {
        if (this.components.fileOpen.value == "") return;

        this.#readFile(e.target.files[0]);
        this.components.fileOpen.value = null;
    }

    /**
     * Callback for drag over event
     * @param e
     */
    #onDragOver = (e) => {
        e.target.setAttribute('drop-active', true);
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    /**
     * Callback for drag leave event
     * @param e
     */
    #onDragLeave = (e) => {
        e.stopPropagation();
        e.preventDefault();
        e.target.removeAttribute('drop-active');
    }

    /**
     * Callback for drop event
     * @param e
     */
    #onDrop = (e) => {
        e.target.removeAttribute('drop-active');
        e.stopPropagation();
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        this.#readFile(file);
    }

    /**
     * Function to read and return the data of the selected/dropped file
     * @param file
     */
    #readFile = (file) => {
        EventHandlerService.publish(PDFLEvents.onResetReader);
        
        const fileReader = new FileReader();
        fileReader.onload = function () {
            EventHandlerService.publish(PDFLEvents.onReadNewFile, new Uint8Array(this.result));
            EventHandlerService.publish(PDFLEvents.onShowReaderView);
        };
        fileReader.readAsArrayBuffer(file);
    }

}

export { FileUploadComponent };