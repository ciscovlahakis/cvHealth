
const { state, on } = createDeepReactiveState();
window.state = state;
Object.defineProperty(window, "state", {
  value: window.state,
  writable: false,
  configurable: false,
});
window.on = on;

on(
  "fragments",
  () => {
    renderFragmentByHash();
  },
  "LAYOUT",
  "hash"
);

window.onhashchange = function () {
  renderFragmentByHash();
};

function renderFragmentByHash() {
  var hash = decodeURIComponent(window.location.hash.substring(1));
  var fragmentElement = document.getElementById("_fragment");
  if (fragmentElement) {
    const fragmentData = getDoc("fragmentsByHash", hash);
    const { htmlContent, fragmentDataParentId, hasStyles, hasScript } = fragmentData;
    if (fragmentElement.getAttribute("data-fragment-data-parent-id") === fragmentDataParentId) {
      return;
    }
    if (!htmlContent) {
      fragmentElement.innerHTML = "";
      //console.error("Fragment not found for hash: " + hash);
      return;
    }
    fragmentElement.setAttribute("data-fragment-data-parent-id", fragmentDataParentId);
    fragmentElement.innerHTML = htmlContent;
    var newContentDiv = fragmentElement.querySelector("div");
    if (newContentDiv) {
      setIds(newContentDiv, fragmentDataParentId);
      const fileName = convertToSnakeCase(hash);
      if (hasStyles !== false) {
        loadStyles(fileName);
      }
      if (hasScript !== false) {
        loadAndExecuteScript(fileName);
      }
    }
  } else {
    console.error("The fragment element with ID '_fragment' does not exist.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  processTemplate();
});

function processTemplate() {
  const templateContainer = document.getElementById("template-container");
  if (!templateContainer) {
    console.error("Template container el does not exist.");
    return;
  }
  const frontMatter = templateContainer.getAttribute("data-front-matter");
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

  const templateElement = document.querySelector(
    "#" + templateName.toLowerCase()
  );
  if (!templateElement) {
    console.error("Template name el does not exist.");
    return;
  }

  setIds(templateElement);

  // Replace main-container with template
  templateContainer.removeAttribute("id"); // Set id to template's
  replacePlaceholderHtml(templateContainer, templateElement.outerHTML);

  document.querySelectorAll("[data-component]").forEach((element) => {
    setIdAndFetchComponent(element);
  });
}

// Start observing the document body for DOM mutations
const observer = new MutationObserver(onElementAdded);
observer.observe(document.body, { childList: true, subtree: true });

// This function will be called whenever a new element is added to the DOM
function onElementAdded(mutationsList, observer) {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.hasAttribute("data-component")) {
            setIdAndFetchComponent(node);
          }
          node.querySelectorAll("[data-component]").forEach((element) => {
            setIdAndFetchComponent(element);
          });
        }
      });
    }
  }
}

function setIdAndFetchComponent(element) {
  var componentName = element.getAttribute("data-component");
  if (!componentName) return;
  if (componentName === "_yield") {
    componentName = getDoc("page")?._yield;
    if (!componentName) {
      console.error("Could not find a _yield in page data.");
      return;
    }
  }
  element.removeAttribute("data-component");
  const parentNode = element.parentNode.closest("[id]");
  const parentId = parentNode.id;

  setIds(element, parentId, null, componentName);
  //console.log(element, parentId);
  fetchComponent(componentName, element, element.id);
}

function setIds(element, parentId, id, componentName) {
  if (id) {
    element.id = id;
  } else {
    var currentId = element.id || componentName;
    if (currentId) {
      element.id = currentId + "-id-" + generateUniqueId();
    }
  }
  if (!parentId) return;
  element.setAttribute("data-parent-id", parentId);
}

function fetchComponent(componentName, placeholder, fragmentDataParentId) {
  var fileName = convertToSnakeCase(componentName);
  const componentPath = `/components/${fileName}`;
  fetch(componentPath)
    .then((response) => {
      if (!response.ok) {
        response
          .text()
          .then((text) =>
            console.error(
              "Failed response body for component:",
              componentName,
              text
            )
          );
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      replacePlaceholderHtml(placeholder, data.htmlContent);
      loadFilesSetFragmentsAndSetDataByType(
        componentName,
        data.frontMatter,
        fragmentDataParentId
      );
    })
    .catch((error) =>
      console.error(`Error fetching component: ${componentName}`, error)
    );
}

function replacePlaceholderHtml(placeholder, htmlContent) {
  // Create a temporary div to parse the HTML content
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;
  // Grab the outermost div from the parsed HTML
  const outerDiv = tempDiv.querySelector("div");
  if (outerDiv) {
    // Copy all attributes from the placeholder to the outer div
    Array.from(placeholder.attributes).forEach((attr) => {
      outerDiv.setAttribute(attr.name, attr.value);
    });
    var existingChildren = placeholder.hasChildNodes()
      ? Array.from(placeholder.childNodes)
      : [];
    if (existingChildren.length > 0) {
      // Find the data-yield div in the new element
      var newDataYieldElement = outerDiv.querySelector("[data-yield]");
      if (newDataYieldElement) {
        // Append the previously saved children to the data-yield div
        existingChildren.forEach((child) => {
          // Check if the child is an element node before setting attributes
          var fileName;
          if (child.nodeType === Node.ELEMENT_NODE) {
            fileName = child.getAttribute("id");
            const id = outerDiv.getAttribute("id");
            const parentId = outerDiv.getAttribute("data-parent-id");
            setIds(child, parentId, id);
          }
          if (fileName) {
            loadAndExecuteScript(fileName);
          }
          newDataYieldElement.appendChild(child);
        });
      }
    }
    // Replace placeholder with the new content and return the new element
    setIds(outerDiv, null, outerDiv.getAttribute("id"));
    placeholder.replaceWith(outerDiv);
  } else {
    console.error("The HTML content does not have an outer div.");
  }
}

function loadFilesSetFragmentsAndSetDataByType(
  fileName,
  frontMatterData,
  fragmentDataParentId
) {
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
  const stylesFilePath = `/public/gcs/styles/${fileName}.css`;
  fetch(stylesFilePath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then((css) => {
      const style = document.createElement("style");
      style.innerHTML = css;
      document.head.appendChild(style);
    })
    .catch((error) => {
      console.error(
        `Error loading or couldn't find styles: ${stylesFilePath}`,
        error
      );
    });
}

function loadAndExecuteScript(fileName) {
  const jsFilePath = `/public/gcs/js/${fileName}.js`;
  const script = document.createElement("script");
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
  fragments.forEach((fragment) => {
    fetchFragment(fragment, fragmentDataParentId);
  });
}

function fetchFragment(fragmentName, fragmentDataParentId) {
  var fileName = convertToSnakeCase(fragmentName);
  const fragmentPath = `/components/${fileName}`;
  fetch(fragmentPath)
    .then((response) => {
      if (!response.ok) {
        response
          .text()
          .then((text) =>
            console.error(
              "Failed response body for fragment (name, file):",
              fragmentName,
              fileName,
              text
            )
          );
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      data = { ...data, ...data.frontMatter };
      data.fragmentDataParentId = fragmentDataParentId;
      delete data.frontMatter;
      setDataByType(data);
    })
    .catch((error) =>
      console.error(
        `Error fetching fragment (name, file): ${fragmentName} ${fileName}`,
        error
      )
    );
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

function initializeScriptElements(fileName) {
  var scriptName = convertToCamelCase(fileName);
  const initializerFunction = window[scriptName];
  if (typeof initializerFunction !== "function") {
    console.error("Initializer function not a function for: ", scriptName);
    return;
  }
  var kebabCaseName = convertToKebabCase(scriptName);
  var selector = '[id^="' + kebabCaseName + '-id-"]';
  var elements = document.querySelectorAll(selector);
  elements.forEach(function (element) {
    const { id } = element;
    const { parentId } = element.dataset;
    initializerFunction(element, id, parentId);
  });
}
