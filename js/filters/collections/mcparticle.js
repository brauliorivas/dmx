import { CheckboxComponent, checkboxLogic } from "../components/checkbox.js";
import { RangeComponent } from "../components/range.js";
import { SimStatusBitFieldDisplayValues } from "../../../mappings/sim-status.js";
import { rangeLogic } from "../components/range.js";
import { bitfieldCheckboxLogic } from "../components/checkbox.js";

function renderMCParticleFilters() {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  const title = document.createElement("p");
  title.textContent = "MC Particle";
  container.appendChild(title);

  const charge = new RangeComponent("charge", "charge", "e");
  const mass = new RangeComponent("mass", "mass", "GeV");
  const momentum = new RangeComponent("momentum", "momentum", "GeV");
  const position = new RangeComponent("position", "position", "mm");
  const time = new RangeComponent("time", "time", "ns");
  const vertex = new RangeComponent("vertex", "vertex", "mm");

  const range = [charge, mass, momentum, position, time, vertex];

  range.forEach((rangeFilter) => {
    container.appendChild(rangeFilter.render());
  });

  const simStatusTitle = document.createElement("p");
  simStatusTitle.textContent = "Simulation Status";
  container.appendChild(simStatusTitle);

  const checkboxes = {
    simStatus: [],
    generatorStatus: [],
  };

  Object.keys(SimStatusBitFieldDisplayValues).forEach((status) => {
    const checkbox = new CheckboxComponent(
      "simulatorStatus",
      SimStatusBitFieldDisplayValues[status]
    );
    checkboxes.simStatus.push(checkbox);
    container.appendChild(checkbox.render());
  });

  const generatorStatusTitle = document.createElement("p");
  generatorStatusTitle.textContent = "Generator Status";
  container.appendChild(generatorStatusTitle);

  [1, 2, 3, 4].map((status) => {
    const checkbox = new CheckboxComponent("generatorStatus", status);
    checkboxes.generatorStatus.push(checkbox);
    container.appendChild(checkbox.render());
  });

  return {
    container,
    filters: {
      range,
      checkboxes,
    },
  };
}

export function initMCParticleFilters(parentContainer) {
  const { container, filters } = renderMCParticleFilters();
  const { range, checkboxes } = filters;

  parentContainer.appendChild(container);

  const criteriaFunction = (object) => {
    for (const filter of range) {
      const { min, max } = filter.getValues();
      if (!rangeLogic(min, max, object, filter.propertyName)) {
        return false;
      }
    }

    const { simStatus, generatorStatus } = checkboxes;

    for (const checkbox of simStatus) {
      const checked = checkbox.checked();
      if (
        !bitfieldCheckboxLogic(
          checked,
          SimStatusBitFieldDisplayValues[checkbox.displayedName],
          object,
          "simulatorStatus"
        )
      ) {
        return false;
      }
    }

    for (const checkbox of generatorStatus) {
      const checked = checkbox.checked();
      if (!checkboxLogic(checked, object, "generatorStatus")) {
        return false;
      }
    }

    return true;
  };

  return criteriaFunction;
}

export function filterMCParticleCollection(criteriaFunction) {}