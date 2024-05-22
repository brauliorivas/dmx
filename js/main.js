import { errorMsg, loadMCParticles } from "./tools.js";
import { PdgToggle } from "./menu/show-pdg.js";
import { drawAll } from "./draw.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const manipulationTools = document.getElementsByClassName("manipulation-tool");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let draggedInfoBox = -1;
let isDragging = false;
let prevMouseX = 0;
let prevMouseY = 0;

let jsonData = {};
const infoBoxes = [];
const parentLinks = [];
const childrenLinks = [];
let visibleBoxes = [];
let visibleParentLinks = [];
let visibleChildrenLinks = [];

const mouseDown = function (event) {
  event.preventDefault();

  const boundigClientRect = canvas.getBoundingClientRect();
  const mouseX = parseInt(event.clientX - boundigClientRect.x);
  const mouseY = parseInt(event.clientY - boundigClientRect.y);

  prevMouseX = mouseX;
  prevMouseY = mouseY;

  for (let i = visibleBoxes.length - 1; i >= 0; i--) {
    if (infoBoxes[visibleBoxes[i]].isHere(mouseX, mouseY)) {
      draggedInfoBox = visibleBoxes[i];
      isDragging = true;
      return;
    }
  }
};

const mouseUp = function (event) {
  if (!isDragging) {
    return;
  }

  event.preventDefault();
  isDragging = false;

  // console.time("drawAll");
  drawAll(ctx, parentLinks, childrenLinks, infoBoxes);
  // console.timeEnd("drawAll");
};

const mouseOut = function (event) {
  if (!isDragging) {
    return;
  }

  event.preventDefault();
  isDragging = false;
};

const mouseMove = function (event) {
  if (!isDragging) {
    return;
  }
  event.preventDefault();

  const boundigClientRect = canvas.getBoundingClientRect();
  const mouseX = parseInt(event.clientX - boundigClientRect.x);
  const mouseY = parseInt(event.clientY - boundigClientRect.y);

  const dx = mouseX - prevMouseX;
  const dy = mouseY - prevMouseY;

  const infoBox = infoBoxes[draggedInfoBox];
  infoBox.x += dx;
  infoBox.y += dy;

  // console.time("drawVisible");
  drawVisible(visibleParentLinks, visibleChildrenLinks, visibleBoxes);
  // console.timeEnd("drawVisible");

  prevMouseX = mouseX;
  prevMouseY = mouseY;
};

const onScroll = function () {
  getVisible();
};

const getVisible = function () {
  const boundigClientRect = canvas.getBoundingClientRect();

  visibleBoxes = [];
  visibleParentLinks = [];
  visibleChildrenLinks = [];

  for (const box of infoBoxes) {
    if (
      box.isVisible(
        0 - boundigClientRect.x,
        0 - boundigClientRect.y,
        window.innerWidth,
        window.innerHeight
      )
    ) {
      visibleBoxes.push(box.id);
    }
  }

  for (const boxId of visibleBoxes) {
    for (const linkId of infoBoxes[boxId].parentLinks) {
      visibleParentLinks.push(linkId);
    }
    for (const parentBoxId of infoBoxes[boxId].parents) {
      for (const linkId of infoBoxes[parentBoxId].childrenLinks) {
        visibleChildrenLinks.push(linkId);
      }
    }
  }
  for (const link of parentLinks) {
    if (
      link.isVisible(
        0 - boundigClientRect.x,
        0 - boundigClientRect.y,
        window.innerWidth,
        window.innerHeight,
        infoBoxes
      )
    ) {
      visibleParentLinks.push(link.id);
    }
  }

  for (const boxId of visibleBoxes) {
    for (const linkId of infoBoxes[boxId].childrenLinks) {
      visibleChildrenLinks.push(linkId);
    }
    for (const childrenBoxId of infoBoxes[boxId].children) {
      for (const linkId of infoBoxes[childrenBoxId].parentLinks) {
        visibleParentLinks.push(linkId);
      }
    }
  }
  for (const link of childrenLinks) {
    if (
      link.isVisible(
        0 - boundigClientRect.x,
        0 - boundigClientRect.y,
        window.innerWidth,
        window.innerHeight,
        infoBoxes
      )
    ) {
      visibleChildrenLinks.push(link.id);
    }
  }

  visibleParentLinks = [...new Set(visibleParentLinks)];
  visibleChildrenLinks = [...new Set(visibleChildrenLinks)];

  /*
  console.log("Visible boxes: ", visibleBoxes);
  console.log("Visible parentLinks: ", visibleParentLinks);
  console.log("Visible childrenLinks: ", visibleChildrenLinks);
  */
};

const drawVisible = function (
  visibleParentLinks,
  visibleChildrenLinks,
  visibleBoxes
) {
  const boundigClientRect = canvas.getBoundingClientRect();
  ctx.clearRect(
    0 - boundigClientRect.x,
    0 - boundigClientRect.y,
    window.innerWidth,
    window.innerHeight
  );
  for (const linkId of visibleParentLinks) {
    parentLinks[linkId].draw(ctx, infoBoxes);
  }
  for (const linkId of visibleChildrenLinks) {
    childrenLinks[linkId].draw(ctx, infoBoxes);
  }
  for (const boxId of visibleBoxes) {
    infoBoxes[boxId].draw(ctx);
  }
};

function start() {
  if (!infoBoxes) {
    return;
  }

  // Get How many rows
  const rows = infoBoxes.map((obj) => {
    return obj.row;
  });
  const maxRow = Math.max(...rows);

  // Order infoBoxes into rows
  const boxRows = [];
  for (let i = 0; i <= maxRow; i++) {
    boxRows.push([]);
  }
  for (const box of infoBoxes) {
    boxRows[box.row].push(box.id);
  }
  const rowWidths = boxRows.map((obj) => {
    return obj.length;
  });
  const maxRowWidth = Math.max(...rowWidths);

  const boxWidth = infoBoxes[0].width;
  const boxHeight = infoBoxes[0].height;
  const horizontalGap = boxWidth * 0.4;
  const verticalGap = boxHeight * 0.3;

  canvas.width =
    boxWidth * (maxRowWidth + 1) + horizontalGap * (maxRowWidth + 1);
  canvas.height = boxHeight * (maxRow + 1) + verticalGap * (maxRow + 2);

  for (const [i, row] of boxRows.entries()) {
    for (const [j, boxId] of row.entries()) {
      const box = infoBoxes[boxId];

      if (row.length % 2 === 0) {
        const distanceFromCenter = j - row.length / 2;
        if (distanceFromCenter < 0) {
          box.x =
            canvas.width / 2 -
            boxWidth -
            horizontalGap / 2 +
            (distanceFromCenter + 1) * boxWidth +
            (distanceFromCenter + 1) * horizontalGap;
        } else {
          box.x =
            canvas.width / 2 +
            horizontalGap / 2 +
            distanceFromCenter * boxWidth +
            distanceFromCenter * horizontalGap;
        }
      } else {
        const distanceFromCenter = j - row.length / 2;
        box.x =
          canvas.width / 2 -
          boxWidth / 2 +
          distanceFromCenter * boxWidth +
          distanceFromCenter * horizontalGap;
      }
      box.y = i * verticalGap + verticalGap + i * boxHeight;
    }
  }

  drawAll(ctx, parentLinks, childrenLinks, infoBoxes);

  getVisible();
}

canvas.onmousedown = mouseDown;
canvas.onmouseup = mouseUp;
canvas.onmouseout = mouseOut;
canvas.onmousemove = mouseMove;
window.onscroll = onScroll;

/*
function showInputModal() {
  const modal = document.getElementById("input-modal");

  modal.style.display = "block";
}
*/

function hideInputModal() {
  const modal = document.getElementById("input-modal");

  modal.style.display = "none";
}

document.getElementById("input-file").addEventListener("change", (event) => {
  for (const file of event.target.files) {
    if (!file.name.endsWith("edm4hep.json")) {
      errorMsg("Provided file is not EDM4hep JSON!");
    }

    if (!file.type.endsWith("/json")) {
      errorMsg("ERROR: Provided file is not EDM4hep JSON!");
    }

    const reader = new FileReader();
    reader.addEventListener("load", (event) => {
      const fileText = event.target.result;
      jsonData = JSON.parse(fileText);

      const eventNumberInput = document.getElementById("event-number");
      eventNumberInput.max = Object.keys(jsonData).length - 1;
      document.getElementById("event-selector").style.display = "block";
    });
    reader.readAsText(file);
    break;
  }
});

document
  .getElementById("visualize-button")
  .addEventListener("click", (event) => {
    event.preventDefault();
    const eventNum = document.getElementById("event-number").value;
    loadMCParticles(jsonData, eventNum, infoBoxes, parentLinks, childrenLinks);
    if (infoBoxes.length === 0) {
      errorMsg("Provided file does not contain any MC particle tree!");
      return;
    }
    for (const eventNum in jsonData) {
      delete jsonData[eventNum];
    }
    start();
    hideInputModal();
    window.scroll((canvas.width - window.innerWidth) / 2, 0);

    for (const tool of manipulationTools) {
      tool.style.display = "flex";
    }

    const pdgToggle = new PdgToggle("show-pdg");
    pdgToggle.init(() => {
      pdgToggle.toggle(infoBoxes, () => {
        drawAll(ctx, parentLinks, childrenLinks, infoBoxes);
      });
    });
  });

export { parentLinks, childrenLinks, infoBoxes, ctx };
