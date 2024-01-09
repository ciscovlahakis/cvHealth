
function performSearch(url, searchTerm) {
  fetch(url)
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.json();
    })
    .then(function(data) {
      if (data.use_firestore) {
        var indexName = url.split('/')[2];
        setupFirestoreListener(indexName, ["parent", "==", searchTerm], function(firestoreData, error) {
          if (error) {
            console.error("Error in Firestore listener:", error);
            setDoc("searchResults", { searchTerm: searchTerm, results: [] });
          } else {
            setDoc("searchResults", { searchTerm: searchTerm, results: firestoreData });
          }
        });
      } else {
        setDoc("searchResults", { searchTerm: searchTerm, results: data });
      }
    })
    .catch(function(error) {
      console.error("Error fetching search results:", error);
      setDoc("searchResults", { searchTerm: searchTerm, results: [] });
    });
}
