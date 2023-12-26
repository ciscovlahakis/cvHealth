
function tableController(element, dataId, dataParentId) {
  PubSub.subscribe(dataParentId, async function(data) {
    var collection = data?.page?.data?.collection;
    if (!collection) return;

    // Fetch collection data
    var fields = await fetchCollectionData(collection);
    if (!fields) return;

    var dataId = element.dataset.id;
    PubSub.publish(dataId, {
      "collection": collection,
      "fields": fields,
      "onRowClicked": onRowClicked,
    });
  });

  // Define a callback function for when a row is clicked
  function onRowClicked(rowData) {
    //console.log(rowData)
    // Handle the row click as needed, maybe open an edit form, etc.
    // PubSub.publish(dataId, {
    //   collection: rowData.collection,
    //   fields: rowData.fields,
    //   item: rowData.item // The data from the row to be edited
    // });
  }

  async function fetchCollectionData(collectionName) {
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
