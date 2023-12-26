
function addItems(dataParentId, element) {
  var dataId = element.dataset.id;
  PubSub.subscribe(dataParentId, function(data) {
    var collection = data?.collection;
    var fields = data?.fields;
    PubSub.publish(dataId, {
      "collection": collection,
      "fields": fields
      // Send table row clicked
    });
  });

  PubSub.publish(dataId, {
    "form_mode": "new"
  });
}
