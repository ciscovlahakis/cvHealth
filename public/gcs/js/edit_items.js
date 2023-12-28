
function editItems(element, dataId, dataParentId) {

  const state = {};

  PubSub.subscribe(dataParentId, function(data) {

    if (!state.onChildChanged) {
      if (data?.onChildChanged) {
        data.onChildChanged({
          columnIcon: "fas fa-edit"
        });
      }
    }

    Object.assign(state, data);

    const { 
      collection,
      fields,
      itemData
    } = state;

    PubSub.publish(dataId, {
      collection,
      fields,
      itemData
    });
  });

  PubSub.publish(dataId, {
    "form_mode": "update"
  });
}
