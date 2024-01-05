
function addItems(_, dataId, dataParentId) {

  ["collection", "fields", "onChildChanged"].forEach((x) => {
    on([dataParentId, x], () => {
      const props = getDoc(dataParentId);
      const { collection, fields, onChildChanged } = props;
      onChildChanged({ childId: dataId });
      upsertDoc(dataId, { collection, fields });
    }, dataId);
  });

  upsertDoc(dataId, { "formMode": "create" });
}
