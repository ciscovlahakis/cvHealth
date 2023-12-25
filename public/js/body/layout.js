
var pageData = {};
var fragmentsData = {};

PubSub.subscribe(EVENTS.TEMPLATE, ({ action, data }) => {
  pageData = data;
});

// Request the full set of fragments data on demand
PubSub.requestFullSet(EVENTS.FRAGMENT, 'LAYOUT', ({ action, data }) => {
  fragmentsData[data?.data?.hash] = data?.data?.content;
  var decodedHash = decodeURIComponent(window.location.hash.substring(1));
  renderFragmentByHash(decodedHash);
});

PubSub.subscribe(EVENTS.FRAGMENT, ({ action, data }) => {
  var fragmentHash = data.hash; // The hash from the published event
  if (fragmentHash) {
    // Update or add the fragment content to the fragmentsData
    fragmentsData[fragmentHash] = data.content;
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
    content = content || fragmentsData[hash];
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
  processTemplate();
});

function processTemplate() {
  const templateContainer = document.getElementById('template-container');
  if (!templateContainer) {
    console.error("Template container el does not exist.");
    return;
  }
  const frontMatter = templateContainer.getAttribute('data-front-matter');
  if (!frontMatter) {
    console.error("Template front matter does not exist.");
    return;
  }
  const frontMatterData = JSON.parse(frontMatter);
  if (!frontMatterData || !Object.keys(frontMatterData).length) {
    console.error("Template front matter data does not exist.");
    return;
  }
  const templateName = frontMatterData?.name;
  if (!templateName) {
    console.error("Template name does not exist.");
    return;
  }

  loadFilesAndPublishEvent(templateName, frontMatterData);

  const templateElement = document.querySelector('#' + templateName.toLowerCase());
  if (!templateElement) {
    console.error("Template name el does not exist.");
    return;
  }

  const uniqueId = generateUniqueId();
  templateElement.setAttribute('data-id', uniqueId); // Set unique data-id for the template

  // Replace main-container with template
  templateContainer.removeAttribute("id"); // Set id to template's
  replacePlaceholderHtml(templateContainer, templateElement.outerHTML);

  document.querySelectorAll('[data-component]').forEach(element => {
    setIdAndFetchComponent(element);
  });
}

// Start observing the document body for DOM mutations
const observer = new MutationObserver(onElementAdded);
observer.observe(document.body, { childList: true, subtree: true });

// This function will be called whenever a new element is added to the DOM
function onElementAdded(mutationsList, observer) {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          setIdAndFetchComponent(node);
        }
      });
    }
  }
}

function setIdAndFetchComponent(element) {
  var componentName = element.getAttribute('data-component');
  if (!componentName) return;
  if (componentName === '_yield') {
    componentName = pageData?._yield;
    if (!componentName) {
      console.error("Template could not find a _yield.");
      return;
    }
  }
  const parentNode = element.parentNode.closest('[data-id]');
  const parentId = parentNode.getAttribute('data-id');
  const uniqueId = generateUniqueId();
  element.setAttribute('data-id', uniqueId); // Set unique data-id for the element
  element.setAttribute('data-parent-id', parentId); // Set data-parent-id to link with the parent
  fetchComponent(componentName, element);
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
      replacePlaceholderHtml(placeholder, data.html_content);
      loadFilesAndPublishEvent(componentName, data.front_matter);
    })
    .catch(error => console.error(`Error fetching component: ${componentName}`, error));
}

function replacePlaceholderHtml(placeholder, html_content) {
  // Create a temporary div to parse the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html_content;
  // Grab the outermost div from the parsed HTML
  const outerDiv = tempDiv.querySelector('div');
  if (outerDiv) {
    // Copy all attributes from the placeholder to the outer div
    Array.from(placeholder.attributes).forEach(attr => {
      outerDiv.setAttribute(attr.name, attr.value);
    });
    // Temporarily disconnect the observer to prevent infinite loop
    observer.disconnect();
    // Replace the placeholder with the new content
    placeholder.outerHTML = outerDiv.outerHTML;
    // Reconnect the observer after the changes
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    console.error('The HTML content does not have an outer div.');
  }
}

function loadFilesAndPublishEvent(fileName, frontMatterData) {
  fileName = convertSnakeToCamel(fileName);
  loadStyles(fileName); // styles
  loadAndExecuteScript(fileName); // script
  publishEvent(frontMatterData); // template, component, fragment
}

function loadStyles(fileName) {
  const stylesFilePath = `/public/gcs/styles/${fileName}.css`;

  fetch(stylesFilePath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(css => {
      const style = document.createElement('style');
      style.innerHTML = css;
      document.head.appendChild(style);
    })
    .catch(error => {
      console.error(`Error loading or couldn't find styles: ${stylesFilePath}`, error);
    });
}

function loadAndExecuteScript(fileName) {
  const jsFilePath = `/public/gcs/js/${fileName}.js`;
  const script = document.createElement('script');
  script.src = jsFilePath;
  script.onload = () => {
    initializeScriptElements(fileName);
  };
  script.onerror = () => { 
    console.error(`Error loading or couldn't find script: ${jsFilePath}`); 
  };
  document.head.appendChild(script);
}

function publishEvent(data) {
  var { type } = data;
  if (!type) {
    type = "component";
    console.error("Event type could not be parsed. Assuming component.");
  }
  type = type.toUpperCase();
  try {
    PubSub.publish(window.EVENTS[type], {
      action: 'create',
      data: data
    });
  } catch (error) {
    console.error('Error publishing event ' + window.EVENTS[type] + ':', error);
  }
}

function initializeScriptElements(scriptName){
  const initializerFunction = window[scriptName];
  if (typeof initializerFunction !== "function") {
    console.error("Initializer function not a function for: ", scriptName);
    return;
  }
  var kebabCaseName = scriptName.replace(/_/g, '-');
  var selector = '[id*="' + kebabCaseName + '"]';
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

function generateUniqueId() {
  const randomPart = Math.random().toString(36).substring(2, 15); // Generate a random string
  const timestampPart = Date.now().toString(36); // Get a string version of the current timestamp
  return `component-${timestampPart}-${randomPart}`;
}
