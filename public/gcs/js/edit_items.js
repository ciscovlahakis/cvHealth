
function editItems(element, dataId, dataParentId) {
  // Subscribe to the selection of a row for editing
  PubSub.subscribe(dataParentId, function(data) {
    var collection = data?.collection;
    var fields = data?.fields;
    var item = data?.item; // This should be the data of the item that needs to be edited

    // Publish the data needed to populate the form to the form component
    PubSub.publish(dataId, {
      "collection": collection,
      "fields": fields,
      "item": item // Pass the data of the item that needs to be edited
    });
  });

  PubSub.publish(dataId, {
    "form_mode": "edit"
  });

}
