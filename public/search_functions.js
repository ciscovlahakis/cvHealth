// Generic search function to perform a search and publish results

function performSearch(url, searchTerm) {
  fetch(url)
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
      return response.json();
    })
    .then(function(data) {
      PubSub.publish('searchResults', { searchTerm: searchTerm, results: data });
    })
    .catch(function(error) {
      console.error("Error fetching search results:", error);
      PubSub.publish('searchResults', { searchTerm: searchTerm, results: [] });
    });
}
