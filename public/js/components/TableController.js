
function tableController(_, dataId, dataParentId) {

  on([dataParentId, "page"], async newValue => {
    const { collection } = newValue;
    const fields = await fetchCollectionFields(collection);
    upsertDoc(dataId, { collection, fields });
  }, dataId);

  const onChildChanged = (childData) => {
    const _childId = getDoc(dataId)?.childId;
    const { columnIcon, childId } = childData || {};
    if (_childId !== childId) {
      upsertDoc(dataId, { columnIcon, childId });
    }
  }

  const onRowClicked = data => {
    const { rowClicked } = data || {};
    setDoc(`${dataId}.rowClicked`, JSON.parse(rowClicked || {}));
  }

  upsertDoc(dataId, { onChildChanged, onRowClicked });

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
