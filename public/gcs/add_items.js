
function addItems(dataParentId, element) {
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
