import {
  buildGraphProcedure,
  expandNode,
  getLinkedPapers,
} from "../services/KnowledgeGraphService";
import {
  EventHandlerService,
  PDFLEvents,
} from "../services/EventHandlerService";
import ForceGraph from "force-graph";

/**
 * Component responsible for displaying the knowledge graph.
 *
 * @property {Object} components object that holds elements within this component
 * @property {HTMLElement} components.knowledgeGraph element in which knowledge graph will be displayed
 * @property {HTMLElement} components.graphDepth input element for depth selection
 * @property {int} depth depth of knowledge graph
 */
class KnowledgeGraphComponent {
  components = {
    knowledgeGraph: document.querySelector("#knowledge-graph"),
    graphDepth: document.querySelector("#graph-depth"),
  };

  /**
   * Creates and initializes new knowledge graph component. Sets depth
   * of knowledge graph to 1.
   *
   * @constructor
   */
  constructor() {
    this.depth = 1;

    this.#registerEvents();
  }

  /**
   * Adds event listeners to component's elements.
   * @private
   */
  #registerEvents = () => {
    this.components.graphDepth.addEventListener("change", this.#depthSelected);
  };

  /**
   * Called when user selects a depth from dropdown menu.
   *
   * @private
   * @param {Event} event event triggered when depth chosen from dropdown menu
   */
  #depthSelected = (event) => {
    const selectedDepth = parseInt(event.target.value);
    if (selectedDepth == this.depth) return;

    this.#changeDepth(selectedDepth);
  };

  /**
   * Sets new depth of knowledge graph and displays graph of that depth.
   *
   * @private
   * @param {int} selectedDepth new depth
   */
  async #changeDepth(selectedDepth) {
    try {
      EventHandlerService.publish(PDFLEvents.onShowTransparentSidePageLoader);
      await buildGraphProcedure(this.graph, selectedDepth, this.depth);
      EventHandlerService.publish(PDFLEvents.onHideSidePageLoader);
    } catch (error) {
      EventHandlerService.publish(PDFLEvents.onShowSidePageError);
    }

    this.depth = selectedDepth;
  }

  /**
   * Setter for PDF document from which knowledge graph will be generated.
   * @param {PDFDocumentProxy} pdfDocument PDF document
   */
  setPDF = (pdfDocument) => {
    this.pdfDocument = pdfDocument;
  };

  /**
   * Displays knowledge graph.
   */
  displayGraph = (depth) => {
    if (!depth) {
      depth = 1;
      EventHandlerService.publish(PDFLEvents.onShowOpaqueSidePageLoader);
    }

    getLinkedPapers(this.pdfDocument, depth).then((linkedPapers) => {
      if (!linkedPapers || linkedPapers.length == 0)
        return EventHandlerService.publish(PDFLEvents.onShowSidePageError);

      EventHandlerService.publish(PDFLEvents.onShowTransparentSidePageLoader);

      let graph = ForceGraph()(this.components.knowledgeGraph)
        .graphData(linkedPapers)
        .nodeId("id")
        .nodeAutoColorBy("group")
        .nodeCanvasObject((node, ctx, globalScale) => {
          const label = node.label.substring(0, 4);
          const fontSize = 14 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(
            (n) => n + fontSize * 0.6
          );

          ctx.fillStyle = "#489c8a";
          ctx.fillRect(
            node.x - bckgDimensions[0] / 2,
            node.y - bckgDimensions[1] / 2,
            ...bckgDimensions
          );

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.textWidth = "900";
          ctx.fillStyle = "white";
          ctx.fillText(label, node.x, node.y);

          node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
        })
        .nodePointerAreaPaint((node, color, ctx) => {
          ctx.fillStyle = color;
          const bckgDimensions = node.__bckgDimensions;
          bckgDimensions &&
            ctx.fillRect(
              node.x - bckgDimensions[0] / 2,
              node.y - bckgDimensions[1] / 2,
              ...bckgDimensions
            );
        })
        .onNodeClick((node) => {
          expandNode(node, graph);
        })
        .linkCurvature(0.06)
        .linkDirectionalArrowLength(7)
        .linkDirectionalArrowRelPos(0.5)
        .linkDirectionalParticles(1)
        .linkDirectionalParticleWidth(5)
        .linkDirectionalParticleColor(["#2980b9"])
        .linkDirectionalArrowColor(["#2980b9"])
        .cooldownTime(300)
        .d3Force("center", null);

      setTimeout(() => graph.zoomToFit(1000), 500);

      EventHandlerService.publish(PDFLEvents.onHideSidePageLoader);
      this.graph = graph;
    });
  };
}

export { KnowledgeGraphComponent };
