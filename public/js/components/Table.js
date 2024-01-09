import Component from '../layout/Component.js';
import { getDoc } from '../utils/stateUtils.js';
import { createNoResultsElement } from '../helpers/renderingHelpers.js';
import { capitalize } from '../utils/stringUtils.js';

export default class Table extends Component {
  constructor(name, route, parentElement) {
    super(name, route, parentElement);
    this.parentElement ||= {};
  }

  onRenderComplete() {
    this.init();
  }

  init() {
    // ["fields", "columnIcon", "onChildChanged"].forEach((x) => {
    //   on([this.parentElement.id, x], () => this.renderTable(getDoc(this.parentElement.id)), this.path);
    // });

    on(this.parentElement.id, async newValue => {
      const { collection } = newValue;
      const fields = await this.fetchCollectionFields(collection);
      this.renderTable({ ...newValue, fields });
    }, this.element.id);

    // Listen to keystrokes, initiate search
    on("keystrokes", async keystrokes => {
      
    });

  }

  renderTable(props) {
    const { fields, columnIcon, onRowClicked } = props;
    if (fields && Array.isArray(fields)) {
      if (this.element) {
        on("searchResults", (payload) => {
          this.renderResults(payload?.results, payload?.searchTerm, fields, columnIcon);
          this.element.addEventListener('click', (event) => {
            this.handleRowClick(event, onRowClicked);
          });
        }, this.element.id);
      } else {
        console.error("Table element not found for appending search results.");
      }
      this.applyGridColumns(fields, columnIcon);
      this.populateHeaders(fields, columnIcon);
    }
  }

  handleRowClick(event, onRowClicked) {
    var targetElement = event.target;
    while (targetElement != null && !targetElement.classList.contains('grid-row')) {
      targetElement = targetElement.parentElement;
    }
    if (targetElement && targetElement.id !== 'template-row') {
      if (onRowClicked) {
        onRowClicked({
          rowClicked: targetElement.dataset?.data
        });
      }
    }
  }

  applyGridColumns(fields, columnIcon) {
    var gridColumnsValue = (columnIcon ? "100px " : "") + fields.map(() => "1fr").join(" ");
    var gridRows = document.querySelectorAll(".grid-row");
    gridRows.forEach((row) => {
      row.style.gridTemplateColumns = gridColumnsValue;
    });
  }

  populateHeaders(fields, columnIcon) {
    var headersRow = document.getElementById("headers");
    headersRow.innerHTML = "";

    if (columnIcon) {
      var iconHeader = document.createElement("div");
      iconHeader.className = "header";
      headersRow.appendChild(iconHeader);
    }

    fields.forEach((field) => {
      var header = document.createElement("div");
      header.className = "header";
      header.textContent = capitalize(field.name) || "";
      headersRow.appendChild(header);
    });
  }

  createRowWithData(data, fields, columnIcon) {
    var row = document.createElement("div");
    row.className = "grid-row sortable-row";

    if (typeof data.id !== "undefined") {
      row.dataset.id = data.id;
      row.dataset.data = JSON.stringify(data);
    } else {
      console.error('Data object is missing "id" property:', data);
    }

    // Create a string for the 'grid-template-columns' style
    var gridColumnsValue =
      "100px " +
      fields
        .map(function () {
          return "1fr";
        })
        .join(" ");
    row.style.gridTemplateColumns = gridColumnsValue;

    if (columnIcon) {
      var iconColumn = createElementWithText("i", ""); // Adjusted to use createElementWithText
      iconColumn.className = columnIcon;
      var iconContainer = document.createElement("div");
      iconContainer.className = "icon-column drag-handle";
      iconContainer.appendChild(iconColumn);
      row.appendChild(iconContainer);
    }

    // Add content cells based on fields
    fields.forEach(function (column) {
      var cell = createElementWithText("div", "");
      cell.className = "content-cell";
      var cellValue = data[column.name];
      cell.textContent = cellValue || "";
      row.appendChild(cell);
    });

    return row;
  }

  renderResults(data, searchTerm, fields, columnIcon) {
    // Clear previous results, but leave the template row and headers
    var children = Array.from(this.element.children);
    children.forEach(function (child) {
      if (child.id !== "template-row" && child.id !== "headers") {
        this.element.removeChild(child);
      }
    });

    // Render new results or a 'no results' message
    if (data && data.length > 0) {
      data.forEach(function (item) {
        var normalizedItem = normalizeData(item);
        this.element.appendChild(
          createRowWithData(normalizedItem, fields, columnIcon)
        );
      });
    } else {
      this.element.appendChild(createNoResultsElement(searchTerm));
    }
  }

  async fetchCollectionFields(collectionName) {
    if (!collectionName) return;
    try {
      var response = await fetch(`/api/collection/collections?field=name&value=${collectionName}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      var collectionData = await response.json();
      return collectionData.fields;
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
      return null;
    }
  }
}
