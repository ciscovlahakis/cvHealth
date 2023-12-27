
function tableController(element, dataId, dataParentId) {

  const state = {};

  PubSub.subscribe(dataParentId, async function(data) {
    // Fetch the collection's fields
    var collection = data?.page?.data?.collection;
    var fields = await fetchCollectionData(collection);

    assignDefined(state, {
      collection,
      fields
    });

    var { 
      collection,
      fields
    } = state;

    PubSub.publish(dataId, {
      collection,
      fields
    });
  });

  PubSub.publish(dataId, {
    "onRowClicked": function(item) {
      PubSub.publish(dataId, {
        item
      });
    },
    "onColumnIconChanged": function(columnIcon) {
      PubSub.publish(dataId, {
        columnIcon
      });
    }
  });

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
