
function table(_, _, dataParentId) {

  PubSub.subscribe(dataParentId, function(data) {

    const {
      fields,
      columnIcon,
      onChildChanged
    } = data;

    if (fields && Array.isArray(fields)) {
      PubSub.subscribe(EVENTS.SEARCH_RESULTS, function(payload) {
        var resultsContainer = document.getElementById('results');
        if (resultsContainer) {
          renderResults(payload.results, resultsContainer, payload.searchTerm, fields, columnIcon);
          resultsContainer.addEventListener('click', function(event) {
            // Starting from the target, move up the DOM until you find a row element
            var targetElement = event.target;
            while (targetElement != null && !targetElement.classList.contains('grid-row')) {
              targetElement = targetElement.parentElement;
            }
            if (targetElement && targetElement.id !== 'template-row') {
              if (onChildChanged) {
                onChildChanged({
                  rowClicked: targetElement.dataset?.data
                });
              }
            }
          });
        } else {
          console.error('Results container not found in the DOM.');
        }
      });

      // Create a string for the 'grid-template-columns' style
      var gridColumnsValue = (columnIcon ? '100px ' : '') + fields.map(function() { return '1fr'; }).join(' ');
      var gridRows = document.querySelectorAll('.grid-row');
      gridRows.forEach(function(row) {
        row.style.gridTemplateColumns = gridColumnsValue;
      });

      // The rest of the code should be setting up the DOM elements based on fields
      // This code assumes the headers and rows are already in the DOM and need to be populated
      var headersRow = document.getElementById('headers');
      headersRow.innerHTML = ''; // Clear existing headers

      if (columnIcon) {
        var iconHeader = document.createElement('div');
        iconHeader.className = 'header';
        headersRow.appendChild(iconHeader);
      }

      fields.forEach(function(field) {
        var header = document.createElement('div');
        header.className = 'header';
        header.textContent = capitalize(field.name) || '';
        headersRow.appendChild(header);
      });
    }
  });

  function createRowWithData(data, fields, columnIcon) {
    var row = document.createElement('div');
    row.className = 'grid-row sortable-row';
  
    if (typeof data.id !== 'undefined') {
      row.dataset.id = data.id;
      row.dataset.data = JSON.stringify(data);
    } else {
      console.error('Data object is missing "id" property:', data);
    }
  
    // Create a string for the 'grid-template-columns' style
    var gridColumnsValue = '100px ' + fields.map(function() { return '1fr'; }).join(' ');
    row.style.gridTemplateColumns = gridColumnsValue;

    if (columnIcon) {
      var iconColumn = createElementWithText('i', ''); // Adjusted to use createElementWithText
      iconColumn.className = columnIcon;
      var iconContainer = document.createElement('div');
      iconContainer.className = 'icon-column drag-handle';
      iconContainer.appendChild(iconColumn);
      row.appendChild(iconContainer);
    }
  
    // Add content cells based on fields
    fields.forEach(function(column) {
      var cell = createElementWithText('div', '');
      cell.className = 'content-cell';
      var cellValue = data[column.name];
      cell.textContent = cellValue || '';
      row.appendChild(cell);
    });
  
    return row;
  }
  
  function renderResults(data, container, searchTerm, fields, columnIcon) {
    // Clear previous results, but leave the template row and headers
    var children = Array.from(container.children);
    children.forEach(function(child) {
      if (child.id !== 'template-row' && child.id !== 'headers') {
        container.removeChild(child);
      }
    });
  
    // Render new results or a 'no results' message
    if (data.length > 0) {
      data.forEach(function(item) {
        var normalizedItem = normalizeData(item);
        container.appendChild(createRowWithData(normalizedItem, fields, columnIcon));
      });
    } else {
      container.appendChild(createNoResultsElement(searchTerm));
    }
  }
}
