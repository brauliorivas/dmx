import { Toggle } from "../menu/toggle.js";
import { togglePDG, toggleId } from "../menu/show-pdg.js";
import {
  bits,
  genStatus,
  renderRangeParameters,
  parametersRange,
  renderGenSim,
  start,
  getWidthFilterContent,
} from "../menu/filter/filter.js";

const filter = document.getElementById("filter");
const filters = document.getElementById("filters");
const manipulationTools = document.getElementsByClassName("manipulation-tool");

export function setupMCParticleFilter(viewObjects, viewCurrentObjects) {
  for (const tool of manipulationTools) {
    tool.style.display = "flex";
  }
  const mcObjects =
    viewCurrentObjects.datatypes["edm4hep::MCParticle"].collection;
  genStatus.reset();
  mcObjects.forEach((mcObject) => {
    genStatus.add(mcObject.generatorStatus);
  });
  genStatus.setCheckBoxes();
  filters.replaceChildren();

  renderRangeParameters(parametersRange);
  renderGenSim(bits, genStatus);

  const width = getWidthFilterContent();
  filter.style.width = width;

  const pdgToggle = new Toggle("show-pdg");
  pdgToggle.init(
    () => {
      toggleId(viewCurrentObjects);
    },
    () => {
      togglePDG(viewCurrentObjects);
    }
  );

  start(viewObjects, viewCurrentObjects);
}
