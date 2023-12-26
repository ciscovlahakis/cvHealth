
function addItems(element, dataId, dataParentId) {
  PubSub.subscribe(dataParentId, function(data) {
    var collection = data?.collection;
    var fields = data?.fields;
    PubSub.publish(dataId, {
      "collection": collection,
      "fields": fields
    });
  });

  PubSub.publish(dataId, {
    "form_mode": "new"
  });
}
