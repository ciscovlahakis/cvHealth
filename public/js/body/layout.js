
function convertSnakeToCamel(snakeStr, prefix) {
  // Split the snake_case string into words
  var words = snakeStr.toLowerCase().split('_');
  
  // Capitalize the first letter of each word if a prefix is provided
  // Otherwise, capitalize the first letter of each word except the first word
  var camelCaseStr = words.map(function(word, index) {
    if (prefix || index > 0) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join('');
  
  // Prepend the prefix if provided
  return prefix ? prefix + camelCaseStr : camelCaseStr;
}

function initializeComponents(selector, initializerFunction){
  var elements = document.querySelectorAll(selector);
  elements.forEach(function(element) {
    initializerFunction(element.dataset.parentId, element);
  });
}

function afterScriptLoad(fileName, initializerFunction) {
  // Convert the file_name from snake_case to kebab-case for the selector
  var kebabCaseName = fileName.replace(/_/g, '-');
  var selector = '[id*="' + kebabCaseName + '"]';
  initializeComponents(selector, initializerFunction);
}

var currentFragmentsData = {};

// Request the full set of fragments data on demand
PubSub.requestFullSet(EVENTS.FRAGMENT, 'LAYOUT', ({ action, data }) => {
  currentFragmentsData[data?.data?.hash] = data?.data?.content;
  var decodedHash = decodeURIComponent(window.location.hash.substring(1));
  renderFragmentByHash(decodedHash);
});

// Subscribe to the FRAGMENT event
PubSub.subscribe(EVENTS.FRAGMENT, ({ action, data }) => {
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
    content = content || currentFragmentsData[hash];
    if (content) {
      fragmentElement.innerHTML = content;
      var initializerFunction = convertSnakeToCamel(hash);
      if (typeof window[initializerFunction] === 'function') {
        afterScriptLoad(hash, window[initializerFunction]);
      }
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
