
function initializeAddItems(dataParentId) {
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
  console.log(dataParentId)
  PubSub.subscribe(dataParentId, function(data) {
    console.log(data)
    var collection = data?.collection;
    var fields = data?.fields;
    console.log("add_items", collection)
    // Get table row clicked
    // PubSub.publish(parentId, {
    //   action: 'create',
    //   data: {
    //     "form_mode": "new",
    //     "action_url": "/create/#{collection}"
    //   }
    // });
  });
}

var addItemsElements = document.querySelectorAll('[id*="add-items"]');
addItemsElements.forEach(function(element) {
  var dataParentId = element.dataset.parentId;
  initializeAddItems(dataParentId, element);
});
