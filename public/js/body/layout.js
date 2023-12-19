
PubSub.subscribe(EVENTS.FRAGMENT_SINGULAR_CHANGED, function(data) {
  var fragment = data?.data;
  var decodedHash = decodeURIComponent(window.location.hash.substring(1));
  renderFragmentByHash(decodedHash, fragment);
});

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

function renderFragmentByHash(hash, fragment) {
  var fragmentElement = document.getElementById('_fragment');
  if (fragmentElement) {
    fragment = fragment?.hash === hash ? fragment : null;
    if (fragment && fragment.content) {
      fragmentElement.innerHTML = fragment.content;
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

handleInitialHash();
