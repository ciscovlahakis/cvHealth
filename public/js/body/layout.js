
const { state, on } = createDeepReactiveState();
window.state = state;
Object.defineProperty(window, 'state', {
  value: window.state,
  writable: false,
  configurable: false
});
window.on = on;

on("fragments", () => {
  renderFragmentByHash();
}, "LAYOUT", "hash");

window.onhashchange = function() {
  renderFragmentByHash();
};

function renderFragmentByHash() {
  var hash = decodeURIComponent(window.location.hash.substring(1));
  var fragmentElement = document.getElementById('_fragment');
  if (fragmentElement) {
    const fragmentData = getDoc("fragmentsByHash", hash);
    const { htmlContent, fragmentDataParentId, hasStyles, hasScript } = fragmentData;
    if (htmlContent) {
      fragmentElement.innerHTML = htmlContent;
      var newContentDiv = fragmentElement.querySelector('div');
      if (newContentDiv) {
        const uniqueId = generateUniqueId();
        newContentDiv.setAttribute('data-id', uniqueId);
        newContentDiv.setAttribute('data-parent-id', fragmentDataParentId);
        // Modify the id of the element
        var currentId = newContentDiv.id;
        var newId = currentId + '-id-' + uniqueId;
        newContentDiv.id = newId;
        const fileName = convertToSnakeCase(hash);
        if (hasStyles !== false) {
          loadStyles(fileName);
        }
        if (hasScript !== false) {
          loadAndExecuteScript(fileName);
        }
      }
    } else {
      fragmentElement.innerHTML = '';
      //console.error("Fragment not found for hash: " + hash);
    }
  } else {
    console.error("The fragment element with ID '_fragment' does not exist.");
  }
}

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

  loadFilesSetFragmentsAndSetDataByType(templateName, frontMatterData);

  const templateElement = document.querySelector('#' + templateName.toLowerCase());
  if (!templateElement) {
    console.error("Template name el does not exist.");
    return;
  }

  const uniqueId = generateUniqueId();
  templateElement.setAttribute('data-id', uniqueId);
  // Modify the id of the element
  var currentId = templateElement.id;
  var newId = currentId + '-id-' + uniqueId;
  templateElement.id = newId;

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
    componentName = getDoc("page")?._yield;
    if (!componentName) {
      console.error("Could not find a _yield in page data.");
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
  const componentPath = `/components/${fileName}`;
  fetch(componentPath)
    .then(response => {
      if (!response.ok) {
        response.text().then(text => console.error("Failed response body for component:", componentName, text));
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      replacePlaceholderHtml(placeholder, data.htmlContent);
      loadFilesSetFragmentsAndSetDataByType(componentName, data.frontMatter, fragmentDataParentId);
    })
    .catch(error => console.error(`Error fetching component: ${componentName}`, error));
}

function replacePlaceholderHtml(placeholder, htmlContent) {
  // Create a temporary div to parse the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  // Grab the outermost div from the parsed HTML
  const outerDiv = tempDiv.querySelector('div');
  if (outerDiv) {
    // Copy all attributes from the placeholder to the outer div
    Array.from(placeholder.attributes).forEach(attr => {
      outerDiv.setAttribute(attr.name, attr.value);
    });
    var existingChildren = placeholder.hasChildNodes() ? Array.from(placeholder.childNodes) : [];
    if (existingChildren.length > 0) {
      // Find the data-yield div in the new element
      var newDataYieldElement = outerDiv.querySelector('[data-yield]');
      if (newDataYieldElement) {
        // Append the previously saved children to the data-yield div
        existingChildren.forEach(child => {
          // Check if the child is an element node before setting attributes
          var fileName;
          if (child.nodeType === Node.ELEMENT_NODE) {
            const dataId = outerDiv.getAttribute('data-id');
            child.setAttribute('data-id', dataId);
            child.setAttribute('data-parent-id', outerDiv.getAttribute('data-parent-id'));
            fileName = child.getAttribute('id');
            // Modify the id of the element
            var currentId = child.id;
            var newId = currentId + '-id-' + dataId;
            child.id = newId;
          }
          if (fileName) {
            loadAndExecuteScript(fileName);
          }
          newDataYieldElement.appendChild(child);
        });
      }
    }
    // Replace placeholder with the new content and return the new element
    // Modify the id of the element
    var currentId = outerDiv.id;
    if (currentId) {
      var dataId = outerDiv.getAttribute('data-id');
      var newId = currentId + '-id-' + dataId;
      outerDiv.id = newId;
    }
    placeholder.replaceWith(outerDiv);
  } else {
    console.error('The HTML content does not have an outer div.');
  }
}

function loadFilesSetFragmentsAndSetDataByType(fileName, frontMatterData, fragmentDataParentId) {
  fileName = convertToSnakeCase(fileName);
  if (frontMatterData?.hasStyles !== false) {
    loadStyles(fileName);
  }
  if (frontMatterData?.hasScript !== false) {
    loadAndExecuteScript(fileName);
  }
  setFragments(frontMatterData, fragmentDataParentId);
  setDataByType(frontMatterData); // template, component, fragment
}

function loadStyles(fileName) {
  console.log(fileName)
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
      data = {...data, ...data.frontMatter };
      data.fragmentDataParentId = fragmentDataParentId;
      delete data.frontMatter;
      setDataByType(data);
    })
    .catch(error => console.error(`Error fetching fragment (name, file): ${fragmentName} ${fileName}`, error));
}

function setDataByType(data) {
  var { type } = data;
  if (data?.frontMatter) {
    type = data.frontMatter?.type;
  }
  if (!type) {
    type = "component";
    console.error("Event type could not be parsed. Assuming component.");
  }
  if (type !== "template") {
    type += "s";
    addDoc(type, data);
  } else {
    type = "page";
    const { page } = data;
    upsertDoc(type, page);
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
  var selector = '[id^="' + kebabCaseName + '-id-"]';
  var elements = document.querySelectorAll(selector);
  //console.log(kebabCaseName, elements)
  elements.forEach(function(element) {
    var lastHyphenIndex = element.id.lastIndexOf('-'); // Finds the last hyphen in the id
    var idSuffix = element.id.substring(lastHyphenIndex + 1); // Extracts the part of the id after the last hyphen
    const { id, parentId } = element.dataset;
    //console.log(kebabCaseName, id, idSuffix)
    if (idSuffix === id) {
      //console.log(fileName, document, elements, id, parentId)
      initializerFunction(element, id, parentId);
    }
  });
}
