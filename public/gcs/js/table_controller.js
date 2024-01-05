
function tableController(element, dataId, dataParentId) {

  on([dataParentId, "page"], async newValue => {
    const { collection } = newValue;
    const fields = await fetchCollectionData(collection);
    upsertDoc(dataId, { collection, fields });
  }, dataId);

  const onChildChanged = (childData) => {
    childData ||= {};
    const { columnIcon, rowClicked, childId } = childData;
    upsertDoc(dataId, { columnIcon, rowClicked, childId });
  }

  upsertDoc(dataId, { onChildChanged });

  // Fetch the collection's fields
  async function fetchCollectionData(collectionName) {
    if (!collectionName) return;
    try {
      var response = await fetch(`/api/collection/collections?field=name&value=${collectionName}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      var collection_data = await response.json();
      return collection_data.fields;
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
      return null;
    }
  }
}
