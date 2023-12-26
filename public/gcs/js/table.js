
function table(dataParentId, element) {

  const state = {};

  PubSub.subscribe(dataParentId, function(data) {
    Object.assign(state, data);
    const {
      fields,
    } = state;

    if (fields && Array.isArray(fields)) {
      PubSub.subscribe(EVENTS.SEARCH_RESULTS, function(payload) {
        var resultsContainer = document.getElementById('results');
        if (resultsContainer) {
          renderResults(payload.results, resultsContainer, payload.searchTerm, fields);
        } else {
          console.error('Results container not found in the DOM.');
        }
      });

      // Create a string for the 'grid-template-columns' style
      var gridColumnsValue = '100px ' + fields.map(function() { return '1fr'; }).join(' ');
      var gridRows = document.querySelectorAll('.grid-row');
      gridRows.forEach(function(row) {
        row.style.gridTemplateColumns = gridColumnsValue;
      });

      // The rest of the code should be setting up the DOM elements based on fields
      // This code assumes the headers and rows are already in the DOM and need to be populated
      var headersRow = document.getElementById('headers');
      headersRow.innerHTML = ''; // Clear existing headers

      // Add the icon header column
      var iconHeader = document.createElement('div');
      iconHeader.className = 'header';
      headersRow.appendChild(iconHeader);

      fields.forEach(function(field) {
        var header = document.createElement('div');
        header.className = 'header';
        header.textContent = capitalize(field.name) || '';
        headersRow.appendChild(header);
      });
    }
  });
}
