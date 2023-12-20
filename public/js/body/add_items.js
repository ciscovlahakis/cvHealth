
function addItems(dataParentId, element) {
  document.body.addEventListener('submit', function(event) {
    if (event.target && event.target.id === 'add-items-form') {
      event.preventDefault();
  
      var formData = new FormData(event.target);
      var nestedHashData = {};
      
      for (var [key, value] of formData.entries()) {
        nestedHashData[key] = { "value": value, "type": "string" }; // Default to string for simplicity
        // You can add a condition to check if the value is numeric and set the type to "integer"
        if (!isNaN(value) && value.trim() !== '') {
          nestedHashData[key].type = "integer";
          nestedHashData[key].value = parseInt(value, 10); // Convert to integer
        }
      }
  
      var actionUrl = event.target.action;
      var jsonBody = JSON.stringify(nestedHashData);
  
      fetch(actionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonBody
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        // Handle the response, update the UI as needed
        var currentUrlWithoutHash = window.location.href.split('#')[0];
        window.history.pushState({}, '', currentUrlWithoutHash);
        renderFragmentByHash();
      })
      .catch(function(error) {
        console.error('Error:', error);
      });
    }
  });

  PubSub.subscribe(dataParentId, function(data) {
    var dataId = element.dataset.id;
    var collection = data?.collection;
    PubSub.publish(dataId, {
      "collection": collection,
      "fields": data?.fields
      // Send table row clicked
    });
  });

  PubSub.publish(dataId, {
    "form_mode": "new"
  });
}
