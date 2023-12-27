
function editItems(element, dataId, dataParentId) {

  const state = {};

  PubSub.subscribe(dataParentId, function(data) {

    if (!state.onColumnIconChanged) {
      if (data?.onColumnIconChanged) {
        data.onColumnIconChanged("fas fa-edit");
      }
    }

    assignDefined(state, data);

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
