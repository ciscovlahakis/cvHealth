
var templateData = {};
var fragmentsData = {};

PubSub.subscribe(EVENTS.TEMPLATE, ({ action, data }) => {
  templateData = data;
});

PubSub.subscribe(EVENTS.FRAGMENT, ({ action, data }) => {
  var frontMatterData = data?.front_matter;
  var fragmentHash = convertToKebabCase(frontMatterData?.hash);
  if (!fragmentHash) return;
  var html_content = data?.html_content;
  var fragmentDataParentId = data?.fragmentDataParentId;
  fragmentsData[fragmentHash] = { 
    html_content: html_content,
    fragmentDataParentId: fragmentDataParentId
  }
  var decodedHash = decodeURIComponent(window.location.hash.substring(1));
  if (fragmentHash === decodedHash) {
    renderFragmentByHash(decodedHash, html_content);
  }
});

function renderFragmentByHash(hash, html_content) {
  var fragmentElement = document.getElementById('_fragment');
  if (fragmentElement) {
    html_content = html_content || fragmentsData[hash]?.html_content;
    if (html_content) {
      fragmentElement.innerHTML = html_content;
      var newContentDiv = fragmentElement.querySelector('div');
      if (newContentDiv) {
        const uniqueId = generateUniqueId();
        newContentDiv.setAttribute('data-id', uniqueId);
        newContentDiv.setAttribute('data-parent-id', fragmentsData[hash]?.fragmentDataParentId);
      }
    } else {
      fragmentElement.innerHTML = '';
      console.error("Fragment not found for hash: " + hash, "\nFragments data: ", fragmentsData);
    }
  } else {
    console.error("The fragment element with ID '_fragment' does not exist.");
  }
}

window.onhashchange = function() {
  var decodedHash = decodeURIComponent(window.location.hash.substring(1));
  renderFragmentByHash(decodedHash);
};

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

  loadFilesSetFragmentsAndPublishEvent(templateName, frontMatterData);

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
          if (node.hasAttribute('data-component')) {
            setIdAndFetchComponent(node);
          }
          node.querySelectorAll('[data-component]').forEach(element => {
            setIdAndFetchComponent(element);
          });
        }
      });
    }
  }
}

function setIdAndFetchComponent(element) {
  var componentName = element.getAttribute('data-component');
  if (!componentName) return;
  if (componentName === '_yield') {
    componentName = templateData?.page?._yield;
    if (!componentName) {
      console.error("Template could not find a _yield.");
      return;
    }
  }
  element.removeAttribute('data-component');
  const parentNode = element.parentNode.closest('[data-id]');
  const parentId = parentNode.getAttribute('data-id');
  const uniqueId = generateUniqueId();
  element.setAttribute('data-id', uniqueId); // Set unique data-id for the element
  element.setAttribute('data-parent-id', parentId); // Set data-parent-id to link with the parent
  fetchComponent(componentName, element, uniqueId);
}

function fetchComponent(componentName, placeholder, fragmentDataParentId) {
  var fileName = convertToSnakeCase(componentName);
  const componentPath = `/components/${fileName}`;;
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
      loadFilesSetFragmentsAndPublishEvent(componentName, data.front_matter, fragmentDataParentId);
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
    placeholder.outerHTML = outerDiv.outerHTML;
  } else {
    console.error('The HTML content does not have an outer div.');
  }
}

function loadFilesSetFragmentsAndPublishEvent(fileName, frontMatterData, fragmentDataParentId) {
  fileName = convertToSnakeCase(fileName);
  if (frontMatterData?.hasStyles !== false) {
    loadStyles(fileName);
  }
  if (frontMatterData?.hasScript !== false) {
    loadAndExecuteScript(fileName);
  }
  setFragments(frontMatterData, fragmentDataParentId);
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

function setFragments(data, fragmentDataParentId) {
  const { fragments } = data;
  if (!fragments) return;
  fragments.forEach(fragment => {
    fetchFragment(fragment, fragmentDataParentId);
  });
}

function fetchFragment(fragmentName, fragmentDataParentId) {
  var fileName = convertToSnakeCase(fragmentName);
  const fragmentPath = `/components/${fileName}`;;
  fetch(fragmentPath)
    .then(response => {
      if (!response.ok) {
        response.text().then(text => console.error("Failed response body for fragment (name, file):", fragmentName, fileName, text));
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      data.fragmentDataParentId = fragmentDataParentId;
      PubSub.publish(EVENTS.FRAGMENT, {
        action: "create",
        data: data
      });
    })
    .catch(error => console.error(`Error fetching fragment (name, file): ${fragmentName} ${fileName}`, error));
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

function initializeScriptElements(fileName){
  var scriptName = convertToCamelCase(fileName);
  const initializerFunction = window[scriptName];
  if (typeof initializerFunction !== "function") {
    console.error("Initializer function not a function for: ", scriptName);
    return;
  }
  var kebabCaseName = convertToKebabCase(scriptName);
  var selector = '[id*="' + kebabCaseName + '"]';
  var elements = document.querySelectorAll(selector);
  elements.forEach(function(element) {
    initializerFunction(element.dataset.parentId, element);
  });
}
