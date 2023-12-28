
function addItems(element, dataId, dataParentId) {

  const state = {};

  PubSub.subscribe(dataParentId, function(data) {

    if (!state.onChildChanged) {
      if (data?.onChildChanged) {
        data.onChildChanged();
      }
    }

    Object.assign(state, data);

    const { 
      collection,
      fields
    } = state;

    PubSub.publish(dataId, {
      collection,
      fields
    });
  });

  PubSub.publish(dataId, {
    "form_mode": "create"
  });
}
