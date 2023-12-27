
function editItems(element, dataId, dataParentId) {

  const state = {};

  PubSub.subscribe(dataParentId, function(data) {
    Object.assign(state, data);
    const { 
      collection,
      fields,
      item 
    } = state;

    PubSub.publish(dataId, {
      collection,
      fields,
      item
    });
  });

  PubSub.publish(dataId, {
    "form_mode": "update"
  });
}
