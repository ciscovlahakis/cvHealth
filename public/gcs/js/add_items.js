
function addItems(dataParentId, element) {
  var dataId = element.dataset.id;
  PubSub.subscribe(dataParentId, function(data) {
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
