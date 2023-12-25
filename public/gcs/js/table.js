function table(dataParentId, element) {
  var fieldsData;

  PubSub.subscribe(dataParentId, async function(data) {
    var collection = data?.page?.data?.collection;
    if (!collection) return;
    try {
      var response = await fetch(`/api/collection/collections?field=name&value=${collection}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      var collection_data = await response.json();
      fieldsData = collection_data.fields;

      if (!Array.isArray(fieldsData)) {
        console.error('Expected fieldsData to be an array');
        return;
      }

      var element = document.querySelector('#table');
      var dataId = element.dataset.id;
      PubSub.publish(dataId, {
        "collection": collection,
        "fields": fieldsData
      });

      // Create a string for the 'grid-template-columns' style
      var gridColumnsValue = '100px ' + fieldsData.map(function() { return '1fr'; }).join(' ');
      var gridRows = document.querySelectorAll('.grid-row');
      gridRows.forEach(function(row) {
        row.style.gridTemplateColumns = gridColumnsValue;
      });

      var headersRow = document.getElementById('headers');
      headersRow.innerHTML = ''; // Clear existing headers

      // Add the icon header column
      var iconHeader = document.createElement('div');
      iconHeader.className = 'header';
      headersRow.appendChild(iconHeader);
      
      fieldsData.forEach(function(field) {
        var header = document.createElement('div');
        header.className = 'header';
        header.textContent = field.title || ''; // Using title or an empty string if title is undefined
        headersRow.appendChild(header);
      });
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
    }
  });

  PubSub.subscribe(EVENTS.SEARCH_RESULTS, function(payload) {
    var resultsContainer = document.getElementById('results');
    if (resultsContainer && fieldsData) {
      renderResults(payload.results, resultsContainer, payload.searchTerm, fieldsData);
    } else {
      console.error('Results container not found in the DOM or fieldsData is not set');
    }
  });
}
