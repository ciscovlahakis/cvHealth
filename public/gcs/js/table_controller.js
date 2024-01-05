
function tableController(_, dataId, dataParentId) {

  on([dataParentId, "page"], async newValue => {
    const { collection } = newValue;
    const fields = await fetchCollectionFields(collection);
    upsertDoc(dataId, { collection, fields });
  }, dataId);

  const onChildChanged = (childData) => {
    const _childId = getDoc(dataId)?.childId;
    const { columnIcon, rowClicked, childId } = childData || {};
    if (!childId || _childId !== childId) {
      upsertDoc(dataId, { columnIcon, rowClicked, childId });
    }
  }

  upsertDoc(dataId, { onChildChanged });

  async function fetchCollectionFields(collectionName) {
    if (!collectionName) return;
    try {
      var response = await fetch(`/api/collection/collections?field=name&value=${collectionName}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      var collectionData = await response.json();
      return collectionData.fields;
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
      return null;
    }
  }
}
