
function addItems(element, dataId, dataParentId) {

  const state = {};

  // function publish(id, data) {
  //   state[id] ||= {};
  //   Object.assign(state[id], data);
  //   PubSub.publish(id, state[id]);
  // }

  // PubSub.subscribe(dataParentId, function(data) {

  //   const { 
  //     collection,
  //     fields,
  //     onChildChanged
  //   } = data;
    
  //   if (!state.onChildChanged) {
  //     if (onChildChanged) {
  //       state.onChildChanged = onChildChanged;
  //       onChildChanged();
  //     }
  //   }
    
  //   publish(dataId, {
  //     collection,
  //     fields
  //   });
  // });

  // publish(dataId, {
  //   "form_mode": "create"
  // });
}
