var currentFragmentsData = {};

// Request the full set of fragments data on demand
PubSub.requestFullSet(EVENTS.FRAGMENTS_MULTIPLE_CHANGED, 'layoutId', function(data) {
  currentFragmentsData = data;
  var decodedHash = decodeURIComponent(window.location.hash.substring(1));
  renderFragmentByHash(decodedHash);
});

// Subscribe to the FRAGMENT_SINGULAR_CHANGED event
PubSub.subscribe(EVENTS.FRAGMENT_SINGULAR_CHANGED, function(data) {
  var fragmentHash = data.hash; // The hash from the published event
  if (fragmentHash) {
    // Update or add the fragment content to the currentFragmentsData
    currentFragmentsData[fragmentHash] = data.content;
  }
  var decodedHash = decodeURIComponent(window.location.hash.substring(1));
  if (fragmentHash === decodedHash) {
    // Render the fragment with the content from the event if the hash matches the URL hash
    renderFragmentByHash(decodedHash, data.content);
  }
})

function renderFragmentByHash(hash, content) {
  var fragmentElement = document.getElementById('_fragment');
  if (fragmentElement) {
    // Retrieve the fragment data from currentFragmentsData using the hash, or use the provided fragment
    content = currentFragmentsData[hash] || content;
    
    if (content) {
      fragmentElement.innerHTML = content;
    } else {
      fragmentElement.innerHTML = '';
      if (hash) {
        console.error("Fragment not found for hash: " + hash);
      }
    }
  } else {
    console.error("The fragment element with ID '_fragment' does not exist.");
  }
}

window.onhashchange = function() {
  var decodedHash = decodeURIComponent(window.location.hash.substring(1));
  renderFragmentByHash(decodedHash);
};

function handleInitialHash() {
  if (window.location.hash) {
    var initialHash = decodeURIComponent(window.location.hash.substring(1));
    renderFragmentByHash(initialHash);
  } else {
    renderFragmentByHash();
  }
}

handleInitialHash();
