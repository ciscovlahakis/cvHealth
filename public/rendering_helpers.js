// Helper functions for rendering search results

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

function createRowWithData(data, fieldsData) {
  var row = document.createElement('div');
  row.className = 'grid-row sortable-row';
  row.dataset.resource = data.resource;
  row.dataset.id = data.objectID; // Use Algolia's objectID as the row identifier

  // Add the icon column for the drag handle
  var iconColumn = createElementWithText('i', ''); // Adjusted to use createElementWithText
  iconColumn.className = 'fas fa-bars';
  var iconContainer = document.createElement('div');
  iconContainer.className = 'icon-column drag-handle';
  iconContainer.appendChild(iconColumn);
  row.appendChild(iconContainer);

  fieldsData.forEach(function(column) {
    var cell = createElementWithText('div', '');
    cell.className = 'content-cell';
    var cellValue = data[column.title.toLowerCase()];
    cell.dataset.id = data.objectID;
    cell.textContent = cellValue || '';
    row.appendChild(cell);
  });

  return row;
}

function renderResults(data, container, searchTerm, fieldsData) {
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
      container.appendChild(createRowWithData(item, fieldsData));
    });
  } else {
    container.appendChild(createNoResultsElement(searchTerm));
  }
}
