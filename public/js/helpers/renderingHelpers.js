
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

export function createNoResultsElement(searchTerm) {
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
