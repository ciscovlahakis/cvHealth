
function performSearch(url, searchTerm) {
  fetch(url)
    .then(function(response) {
      // First, check if the response status is OK (status code 200)
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      // Then, attempt to parse the response as JSON
      return response.json();
    })
    .then(function(data) {
      if (data.use_firestore) {
        // Extract the indexName from the URL
        var indexName = url.split('/')[2];
        setupFirestoreListener(indexName, searchTerm);
      } else {
        setDoc("searchResults", { searchTerm: searchTerm, results: data });
      }
    })
    .catch(function(error) {
      console.error("Error fetching search results:", error);
      // Handle non-JSON responses or other fetch errors
      setDoc("searchResults", { searchTerm: searchTerm, results: [] });
    });
}
