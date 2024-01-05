
function addItems(_, dataId, dataParentId) {

  ["collection", "fields", "onChildChanged"].forEach((x) => {
    on([dataParentId, x], () => {
      const props = getDoc(dataParentId);
      const { collection, fields, onChildChanged, childId } = props;
      if (childId !== dataId) {
        onChildChanged({ childId: dataId });
      }
      upsertDoc(dataId, { collection, fields });
    }, dataId);
  });

  upsertDoc(dataId, { "formMode": "create" });
}
