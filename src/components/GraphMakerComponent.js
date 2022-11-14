//Mock data
let nodesMock = [
  {
      "id": "649def34f8be52c8b66281af98ae884c09aef38b",
      "label": "Construction of the Literature Graph in Semantic Scholar",
  },
  {
      "id": "1fec9d41d372267b4474f18cbeadd806c8b67adb",
      "label": "Extracting Scientific Figures with Distantly Supervised Neural Networks",
  },
  {
      "id": "921b2958cac4138d188fd5047aa12bbcf37ac867",
      "label": "Content-Based Citation Recommendation",
  },
  {
      "id": "2264e14e35dc5a3db93437bc408a03171af8c59d",
      "label": "The AI2 system at SemEval-2017 Task 10 (ScienceIE): semi-supervised end-to-end entity and relation extraction",
  },
  {
      "id": "74a69228157b3fa1c7adc14e7715039e54f4b067",
      "label": "MetaMap Lite: an evaluation of a new Java implementation of MetaMap",
  },
  {
      "id": "25b77db5bfca92029532ca70ee659fdf88db8484",
      "label": "SMAuC - The Scientific Multi-Authorship Corpus",
  },
  {
      "id": "7e0fda71cc2e561385c0a2e29f5a81654a11157f",
      "label": "VarMAE: Pre-training of Variational Masked Autoencoder for Domain-adaptive Language Understanding",
  },
  {
      "id": "4a236906f5bed6385c7b3bf3f10a0099e41d4566",
      "label": "Semantic-Native Communication: A Simplicial Complex Perspective",
  },
  {
      "id": "97394fd6876dd10a0bdf233beb8216f16e074bee",
      "label": "Visual Exploration of Literature with Argo Scholar",
  },
  {
      "id": "42b2fd8a0ab69281022de528c591c665f5f2ad3b",
      "label": "A Multi-Domain Benchmark for Personalized Search Evaluation",
  }
];

let linksMock = [
  {
      "id": "0",
      "source": "649def34f8be52c8b66281af98ae884c09aef38b",
      "target": "1fec9d41d372267b4474f18cbeadd806c8b67adb"
  },
  {
      "id": "1",
      "source": "649def34f8be52c8b66281af98ae884c09aef38b",
      "target": "921b2958cac4138d188fd5047aa12bbcf37ac867"
  },
  {
      "id": "2",
      "source": "649def34f8be52c8b66281af98ae884c09aef38b",
      "target": "2264e14e35dc5a3db93437bc408a03171af8c59d",
  },
  {
      "id": "3",
      "source": "649def34f8be52c8b66281af98ae884c09aef38b",
      "target": "74a69228157b3fa1c7adc14e7715039e54f4b067",
  },
  {
      "id": "4",
      "source": "25b77db5bfca92029532ca70ee659fdf88db8484",
      "target": "649def34f8be52c8b66281af98ae884c09aef38b",
  },
  {
      "id": "5",
      "source": "7e0fda71cc2e561385c0a2e29f5a81654a11157f",
      "target": "649def34f8be52c8b66281af98ae884c09aef38b"
  },
  {
      "id": "6",
      "source": "4a236906f5bed6385c7b3bf3f10a0099e41d4566",
      "target": "649def34f8be52c8b66281af98ae884c09aef38b"
  },
  {
      "id": "7",
      "source": "97394fd6876dd10a0bdf233beb8216f16e074bee",
      "target": "649def34f8be52c8b66281af98ae884c09aef38b"
  },
  {
      "id": "8",
      "source": "42b2fd8a0ab69281022de528c591c665f5f2ad3b",
      "target": "649def34f8be52c8b66281af98ae884c09aef38b"
  }
]

class GraphMakerComponent {
  components = {
    fullScreen: document.querySelector("#full-screen"),//TODO: move
    body: document.querySelector("body"),//TODO: move
    knowledgeGraph: document.querySelector("#knowledge-graph"),
  };

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
    this.components.fullScreen.addEventListener("click", this.#showFullScreen);
  };

  /**
   * Callback for showing pdf reader view in full screen when button clicked
   */
  #showFullScreen = () => {
    if (this.components.body.requestFullscreen) {
      this.components.body.requestFullscreen();
    } else if (this.components.body.webkitRequestFullscreen) {
      /* Safari */
      this.components.body.webkitRequestFullscreen();
    } else if (this.components.body.msRequestFullscreen) {
      /* IE11 */
      this.components.body.msRequestFullscreen();
    }
  };

  /**
   * Displays knowledge graph.
   */
  displayGraph = () => {
    let data = {nodes: nodesMock, links: linksMock}; //TODO: call service to generate data

    ForceGraph()(this.components.knowledgeGraph)
      .graphData(data)
      .nodeId("id")
      .nodeAutoColorBy("group")
      .nodeCanvasObject((node, ctx, globalScale) => { //TODO: add custom style
        const label = node.label;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        const textWidth = ctx.measureText(label).width;
        const bckgDimensions = [textWidth, fontSize].map(
          (n) => n + fontSize * 0.2
        ); // some padding

        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(
          node.x - bckgDimensions[0] / 2,
          node.y - bckgDimensions[1] / 2,
          ...bckgDimensions
        );

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = node.color;
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
      .linkDirectionalArrowLength(6);
  };
}

export { GraphMakerComponent };
