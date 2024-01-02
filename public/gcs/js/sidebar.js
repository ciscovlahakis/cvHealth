
function sidebar(element, dataId, dataParentId) {
  const pagePath = [dataParentId, "page"]
  const componentsPath = [dataParentId, "components"];
  const fragmentsByHashPath = [dataParentId, "fragmentsByHash"];

  on(pagePath, (newValue) => {
    console.log(newValue)
    createHandlerForDropdownComponent(newValue);
  });

  on(componentsPath, (newValue) => {
    console.log(newValue)
    createHandlerForDropdownComponent(newValue);
  });

  on(fragmentsByHashPath, (newValue) => {
    console.log(newValue)
    updateFragments(newValue);
  });

  function createHandlerForDropdownComponent(components) {
    if (Array.isArray(components)) {
      components.forEach((component) => {
        if (shouldCreateDropdown(component)) {
          createDropdownComponent(component);
        }
      });
    } else {
      createDropdownComponent(components);
    }
  }

  function updateFragments(fragmentsByHash) {
    // Function to check if any hash in the fragments array is in fragmentsByHash
    function hasRelevantFragment(fragments) {
      return fragments.some((fragment) =>
        fragmentsByHash.hasOwnProperty(fragment)
      );
    }

    const page = getDoc(pagePath);
    const components = getCollection(componentsPath);

    // Check 'page' and 'components' for relevant fragments
    if (page && page.fragments && hasRelevantFragment(page.fragments)) {
      createHandlerForDropdownComponent(page);
    }

    if (components) {
      components.forEach((component) => {
        if (component.fragments && hasRelevantFragment(component.fragments)) {
          createHandlerForDropdownComponent(component);
        }
      });
    }
  }

  function createDropdownComponent(component) {
    const fragmentsByHash = getDoc(fragmentsByHashPath);
    if (!component) {
      console.error("createDropdownComponent called with undefined component");
      return;
    }
    var dropdown = document.createElement("div");
    dropdown.className = "dropdown";
    dropdown.id = "dropdown-" + (component.name || "").replace(/\s+/g, "-");

    var existingDropdown = document.getElementById(dropdown.id);
    if (existingDropdown) {
      // Re-populate the dropdown with updated fragment data
      component.fragments.forEach(function (fragmentHash) {
        var fragmentData = fragmentsByHash[fragmentHash]?.front_matter;
        if (fragmentData) {
          var fragmentAnchorId = "fragment-" + fragmentHash;
          var existingFragmentAnchor = existingDropdown.querySelector(
            "#" + fragmentAnchorId
          );

          if (existingFragmentAnchor) {
            // Update the existing anchor element
            existingFragmentAnchor.textContent =
              fragmentData.name || "Resource Not Found";
            existingFragmentAnchor.href = `#${fragmentHash}`;
          } else {
            // Create and append a new anchor element
            var fragmentAnchor = createAnchorElement(
              fragmentData.name || "Resource Not Found",
              `#${fragmentHash}`,
              "dropdown-item tab"
            );
            fragmentAnchor.id = fragmentAnchorId;
            existingDropdown.appendChild(fragmentAnchor);

            fragmentAnchor.addEventListener("click", function (event) {
              event.preventDefault();
              window.location.hash = fragmentHash;
            });
          }
        }
      });
      return existingDropdown;
    }

    var toggle = createToggle(component);
    var menu = createMenu(toggle.id);

    if (component.route) {
      var homeTab = createAnchorElement(
        "Home",
        component.route,
        "dropdown-item tab"
      );
      menu.prepend(homeTab);
    }

    if (component.pages && component.pages.length > 0) {
      component.pages.forEach(function (route) {
        if (!route) {
          return;
        }
        fetch(`/api/collection/pages?field=route&value=${route}`)
          .then((response) => {
            if (!response.ok) {
              console.error("Response not OK for route", route);
              return;
            }
            return response.json();
          })
          .then((data) => {
            var menuItem = createAnchorElement(
              data.name || "Resource Not Found",
              `/${route}`,
              "dropdown-item tab"
            );
            menu.appendChild(menuItem);
          })
          .catch((error) => {
            console.error(
              "There has been a problem with your fetch operation:",
              error
            );
          });
      });
    }
    if (fragmentsByHash) {
      if (component.fragments && component.fragments.length > 0) {
        component.fragments.forEach(function (fragmentHash) {
          var fragmentData = fragmentsByHash[fragmentHash]?.front_matter;

          if (fragmentData) {
            var fragmentAnchor = createAnchorElement(
              fragmentData.name || "Resource Not Found",
              `#${fragmentHash}`,
              "dropdown-item tab"
            );

            var fragmentAnchorId = "fragment-" + fragmentHash;
            fragmentAnchor.id = fragmentAnchorId;
            menu.appendChild(fragmentAnchor);

            fragmentAnchor.addEventListener("click", function (event) {
              event.preventDefault();
              window.location.hash = fragmentHash;
            });
          }
        });
      }
    }

    dropdown.appendChild(toggle);
    dropdown.appendChild(menu);

    toggle.addEventListener("click", function () {
      menu.classList.toggle("show");
      toggle.querySelector(".caret").textContent = menu.classList.contains(
        "show"
      )
        ? "\u25BC"
        : "\u25B6";
    });

    element.appendChild(dropdown);

    return dropdown;
  }

  function shouldCreateDropdown(component) {
    return (
      (component.pages && component.pages.length > 0) ||
      (component.fragments && component.fragments.length > 0)
    );
  }

  function createAnchorElement(textContent, href, className) {
    var anchor = document.createElement("a");
    anchor.className = className;
    anchor.textContent = textContent;
    anchor.href = convertToKebabCase(href);
    return anchor;
  }

  function createToggle(component) {
    var toggle = document.createElement("div");
    toggle.className = "tab dropdown-toggle";
    toggle.id = "dropdownMenu" + (component.name || "").replace(/\s+/g, "");
    toggle.setAttribute("data-toggle", "dropdown");
    toggle.setAttribute("aria-haspopup", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = '<span class="caret">&#9660;</span> ' + component.name;
    return toggle;
  }

  function createMenu(toggleId) {
    var menu = document.createElement("div");
    menu.className = "dropdown-menu show";
    menu.setAttribute("aria-labelledby", toggleId);
    return menu;
  }
}
