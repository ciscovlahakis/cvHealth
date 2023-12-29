
function editItems(_, dataId, dataParentId) {

  state[dataId].form_mode = "update";

  const { collection, fields, item } = state[dataParentId];

  state[dataId].collection = collection;
  state[dataId].fields = fields;
  state[dataId].item = item;

  state[dataParentId].columnIcon = "fas fa-edit";
}
