
function deleteItems(_, dataId, dataParentId) {

  ["collection", "fields", "rowClicked", "onChildChanged"].forEach((x) => {
    on([dataParentId, x], () => {
      const props = getDoc(dataParentId);
      const { collection, fields, rowClicked, onChildChanged } = props;
      if (onChildChanged) {
        onChildChanged({ childId: dataId, "columnIcon": "fas fa-trash" });
      }
      upsertDoc(dataId, { collection, fields });
      setDoc(`${dataId}.deleteItem`, rowClicked);
    }, dataId);
  });
}
