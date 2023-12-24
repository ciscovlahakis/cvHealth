
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
      // Set the inner HTML of the fragment element
      fragmentElement.innerHTML = content;

      // Ensure the new content has the 'data-component' attribute for the MutationObserver
      // This assumes that your fragment content is wrapped in a div with the component's name
      var newContentDiv = fragmentElement.querySelector('div');
      if (newContentDiv) {
        newContentDiv.setAttribute('data-component', hash);
      }

      // The MutationObserver set up in dom_observer.js will now automatically detect
      // this new content and load the corresponding JS file without the need for afterScriptLoad.

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

document.addEventListener("DOMContentLoaded", () => {
  processMainPage();
});

function processMainPage() {
  document.querySelectorAll('[data-component]').forEach(element => {
    const componentName = element.getAttribute('data-component');
    fetchComponent(componentName, element);
  });

  const mainContainer = document.getElementById('main-container');
  if (mainContainer) {
    const frontMatter = mainContainer.getAttribute('data-front-matter');
    if (frontMatter) {
      const frontMatterData = JSON.parse(frontMatter);
      const templateName = frontMatterData?.name;
      const scriptName = convertSnakeToCamel(templateName);
      loadAndExecuteScript(scriptName);
      publishEvent(frontMatterData);
    }
  }
}

// Start observing the document body for DOM mutations
const observer = new MutationObserver(onElementAdded);
observer.observe(document.body, { childList: true, subtree: true });

// This function will be called whenever a new element is added to the DOM
function onElementAdded(mutationsList, observer) {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('data-component')) {
          const componentName = node.getAttribute('data-component');
          fetchComponent(componentName, node);
        }
      });
    }
  }
}

function fetchComponent(componentName, placeholder) {
  const componentPath = `/components/${componentName}`;;

  fetch(componentPath)
    .then(response => {
      if (!response.ok) {
        response.text().then(text => console.error("Failed response body for component:", componentName, text));
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      placeholder.innerHTML = data.html_content;
      placeholder.removeAttribute('data-component');

      const scriptName = convertSnakeToCamel(componentName);
      loadAndExecuteScript(scriptName);

      publishEvent(data.front_matter);
    })
    .catch(error => console.error(`Error fetching component: ${componentName}`, error));
}

function publishEvent(data) {
  var { type } = data;
  if (type === "template") type = "page";
  type = type.toUpperCase();

  try {
    PubSub.publish(window.EVENTS[type], {
      action: 'create',
      data: data
    });
  } catch (error) {
    console.error('Error publishing event ' + window.EVENTS['#{type}'] + ':', error);
  }
}

function loadAndExecuteScript(scriptName) {
  const jsFilePath = `/public/gcs/${scriptName}.js`;
  const script = document.createElement('script');
  script.src = jsFilePath;
  
  script.onload = () => {
    const initializerFunction = window[scriptName];
    if (typeof initializerFunction === "function") { 
      initializerFunction(); 
    }
  };
  
  script.onerror = () => { 
    console.error(`Error loading script: ${jsFilePath}`); 
  };
  
  document.head.appendChild(script);
}

function afterScriptLoad(fileName, initializerFunction) {
  // Convert the file_name from snake_case to kebab-case for the selector
  var kebabCaseName = fileName.replace(/_/g, '-');
  var selector = '[id*="' + kebabCaseName + '"]';
  initializeComponents(selector, initializerFunction);
}

function initializeComponents(selector, initializerFunction){
  var elements = document.querySelectorAll(selector);
  elements.forEach(function(element) {
    initializerFunction(element.dataset.parentId, element);
  });
}

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
