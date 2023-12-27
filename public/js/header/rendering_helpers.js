// Helper functions for rendering search results

function normalizeData(item) {
  var normalizedItem = {
    id: item.objectID || item.id // Fallback to 'id' if 'objectID' is not present
  };

  // Add additional properties needed for creating the row
  for (var key in item) {
    if (item.hasOwnProperty(key)) {
      normalizedItem[key] = item[key];
    }
  }

  // Check if the required properties are still undefined
  if (typeof normalizedItem.id === 'undefined') {
    console.error('Normalized data object is missing "id" property:', normalizedItem);
  }

  return normalizedItem;
}

function createNoResultsElement(searchTerm) {
  var noResultsElement = document.createElement('div');
  noResultsElement.classList.add('no-results');
  var noResultsMessage = createElementWithText('h2', 'Sorry, we couldn\'t find results for "' + searchTerm + '".');
  var suggestionsList = document.createElement('ul');
  var suggestions = [
    'Check your search for typos.',
    'Use more generic search terms.',
    'Try different search terms.',
    'Try fewer search terms.',
    'Need help finding something? Contact us.'
  ];
  suggestions.forEach(function(suggestion) {
    var listItem = createElementWithText('li', suggestion);
    suggestionsList.appendChild(listItem);
  });

  appendChildren(noResultsElement, [noResultsMessage, suggestionsList]);
  return noResultsElement;
}

function createElementWithText(type, text) {
  var element = document.createElement(type);
  element.innerText = text;
  return element;
}

function appendChildren(parent, children) {
  children.forEach(function(child) {
    parent.appendChild(child);
  });
}

function createRowWithData(data, fields) {
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

  // Add the icon column for the drag handle
  var iconColumn = createElementWithText('i', ''); // Adjusted to use createElementWithText
  iconColumn.className = 'fas fa-bars';
  var iconContainer = document.createElement('div');
  iconContainer.className = 'icon-column drag-handle';
  iconContainer.appendChild(iconColumn);
  row.appendChild(iconContainer);

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

function renderResults(data, container, searchTerm, fields) {
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
      container.appendChild(createRowWithData(normalizedItem, fields));
    });
  } else {
    container.appendChild(createNoResultsElement(searchTerm));
  }
}
