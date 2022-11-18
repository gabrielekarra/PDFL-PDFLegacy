import { MAX_CITATION } from "../Constants";
import { fetchCitations, fetchPaperInfo, fetchReferences } from "./Api";
import { compareSimilarity } from "./Utils";

/**
 * @typedef {Object} PaperInfo
 * @property {string} paperId
 * @property {string} title
 * @property {int} citationCount
 * @property {int} influentialCitationCount
 */

/**
 * @typedef {Object} LinkedPapers
 * @property {PaperInfo[]} citations
 * @property {PaperInfo[]} references
 */

/**
 * Gets citations and references for a pdf document and the
 * reference and citation count for those papers.
 *
 * @async
 * @param {Pdfjs Document} pdfDoc
 * @returns {Promise<LinkedPapers>} linked papers of 'pdfDoc'
 */
async function getLinkedPapers(pdfDoc) {
  let metadata = await pdfDoc.getMetadata();

  // TODO: check if some useful ID is in the metadata

  let title = metadata.info.Title;
  if (!title) {
    console.warn("Title not in metadata!");
    // TODO: parse references from pdf text
    return [];
  }

  let currentPaperInfo = await fetchPaperInfo(title);
  if (!currentPaperInfo || !compareSimilarity(currentPaperInfo.title, title)) {
    console.warn("Titles do not match!");
    // TODO: parse references from pdf text
    return [];
  }

  return await getLinkedPapersByPaper(currentPaperInfo);
}

/**
 * Gets citations and references for a pdf document and the
 * reference and citation count for those papers.
 *
 * @async
 * @param {PaperInfo} paperInfo
 * @returns {Promise<LinkedPapers>} linked papers of 'pdfDoc'
 */
async function getLinkedPapersByPaper(paperInfo) {
  let [citations, references] = await Promise.all([
    getCitations(paperInfo.paperId),
    getReferences(paperInfo.paperId),
  ]);

  return getGraphStructure(
    paperInfo.paperId,
    paperInfo.title,
    references,
    citations
  );
}

/**
 * Gets papers that cite this paper.
 *
 * @async
 * @param {string} paperID
 * @returns {Promise<PaperInfo[]>}
 */
async function getCitations(paperID) {
  let data = await fetchCitations(paperID);
  return data.map(({ citingPaper }) => citingPaper);
}

/**
 * Gets papers that are cited by this paper.
 *
 * @async
 * @param {string} paperID
 * @returns {Promise<PaperInfo[]>}
 */
async function getReferences(paperID) {
  let data = await fetchReferences(paperID);
  return data.map(({ citedPaper }) => citedPaper);
}

/**
 * @typedef {Object} Node
 * @property {string} id
 * @property {string} label
 */

/**
 * @typedef {Object} Link
 * @property {string} id
 * @property {string} source
 * @property {string} target
 */

/**
 * @typedef {Object} GraphData
 * @property {Node[]} nodes
 * @property {Link[]} links
 */

/**
 * Returns object structure of paper's references and citations
 * that graph generatior takes in.
 *
 * @param {string} paperId paper id
 * @param {string} paperTitle paper title
 * @param {PaperInfo[]} references papers that paper is referencing
 * @param {PaperInfo[]} citations papers that are citing the paper
 * @returns {GraphData}
 */
function getGraphStructure(paperId, paperTitle, references, citations) {
  let nodes = new Array();
  let links = new Array();

  nodes.push({ id: paperId, label: paperTitle });

  for (let reference of references) {
    if (reference.paperId && reference.paperId != "") {
      nodes.push({ id: reference.paperId, label: reference.title });
      links.push({
        id: reference.paperId + paperId,
        source: paperId,
        target: reference.paperId,
      });
    }
  }

  for (let citation of citations) {
    if (citation.paperId && citation.paperId != "") {
      nodes.push({ id: citation.paperId, label: citation.title });
      links.push({
        id: citation.paperId + paperId,
        source: citation.paperId,
        target: paperId,
      });
    }
  }

  return { nodes: nodes, links: links };
}

async function buildGraphProcedure(graph, nodesToExpand) {
  for (let [i, node] of nodesToExpand.nodes.entries()) {
    if (i + 1 == MAX_CITATION) {
      break;
    }
    let linkedPapers = await getLinkedPapersByPaper({
      paperId: node.id,
      title: node.label,
    });
    //linkedPapers.nodes.splice(0, 1);
    addToGraph(graph, linkedPapers);
  }
}

function addToGraph(graph, linkedPapers) {
  const { nodes, links } = graph.graphData();
  const nodesToAdd = linkedPapers.nodes;
  const linksToAdd = linkedPapers.links;
  let nodeToAddFiltered = [];
  let nodeIdsInGraph = nodes.map(({ id }) => id);
  for (let node of nodesToAdd) {
    if (nodeIdsInGraph.includes(node.id)) {
      continue;
    }
    nodeToAddFiltered.push(node);
  }

  let linksToAddFiltered = [];
  let linkIdsInGraph = links.map(({ id }) => id);
  for (let link of linksToAdd) {
    if (linkIdsInGraph.includes(link.id)) {
      continue;
    }
    linksToAddFiltered.push(link);
  }

  nodes.push(...nodeToAddFiltered);
  links.push(...linksToAddFiltered);
  graph.graphData({
    nodes: nodes,
    links: links,
  });
}

export { getLinkedPapers, getCitations, getReferences, buildGraphProcedure };