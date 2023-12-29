
function tableController(element, dataId, dataParentId) {

  const state = {};

  function publish(id, data) {
    state[id] ||= {};
    Object.assign(state[id], data);
    PubSub.publish(id, state[id]);
  }

  PubSub.subscribe(dataParentId, async function(data) {
    var collection = data?.page?.data?.collection;
    var fields = await fetchCollectionData(collection);

    publish(dataId, {
      collection,
      fields
    });
  });

  publish(dataId, {
    onChildChanged: (childData) => {
      childData ||= {};

      const {
        columnIcon,
        rowClicked
      } = childData;

      publish(dataId, {
        columnIcon,
        itemData: rowClicked
      });
    }
  });

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
