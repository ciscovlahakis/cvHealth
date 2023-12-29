
function sidebar(element, dataId, dataParentId) {
  let dependencyMap = {
    page: (currentState) => createHandlerForDropdownComponent(currentState.page, currentState.fragmentsByHash),
    components: (currentState) => createHandlerForDropdownComponent(currentState.components, currentState.fragmentsByHash),
    fragmentsByHash: (currentState) => updateFragments(currentState.fragmentsByHash, currentState.page, currentState.components)
  };

  createReactiveState(state[dataParentId], dependencyMap);

  function createHandlerForDropdownComponent(arg, fragmentsByHash) {
    return function() {
      if (Array.isArray(arg)) {
        arg.forEach(component => {
          if (shouldCreateDropdown(component)) {
            createDropdownComponent(component, fragmentsByHash);
          }
        });
      } else {
        createDropdownComponent(arg, fragmentsByHash);
      }
    };
  }

  function updateFragments(fragmentsByHash, page, components) {
    // Function to check if any hash in the fragments array is in fragmentsByHash
    function hasRelevantFragment(fragments) {
      return fragments.some(fragment => fragmentsByHash.hasOwnProperty(fragment));
    }

    // Check 'page' and 'components' for relevant fragments
    if (page && page.fragments && hasRelevantFragment(page.fragments)) {
      createHandlerForDropdownComponent(page, fragmentsByHash)();
    }

    if (components) {
      components.forEach(component => {
        if (component.fragments && hasRelevantFragment(component.fragments)) {
          createHandlerForDropdownComponent(component, fragmentsByHash)();
        }
      });
    }
  }

  function createDropdownComponent(properties, fragmentsByHash) {
    if (!properties) {
        console.error("createDropdownComponent called with undefined properties");
        return;
    }
    var dropdown = document.createElement('div');
    dropdown.className = 'dropdown';
    dropdown.id = 'dropdown-' + (properties.name || '').replace(/\s+/g, '-');

    var toggle = createToggle(properties);
    var menu = createMenu(toggle.id);

    if (properties.route) {
      var homeTab = createAnchorElement("Home", properties.route, 'dropdown-item tab');
      menu.prepend(homeTab);
    }

    if (properties.pages && properties.pages.length > 0) {
      properties.pages.forEach(function(route) {
        if (!route) {
          return;
        }
        fetch(`/api/collection/pages?field=route&value=${route}`)
          .then(response => {
            if (!response.ok) {
              console.error('Response not OK for route', route);
              return;
            }
            return response.json();
          })
          .then(data => {
            var menuItem = createAnchorElement(
              data.name || "Resource Not Found",
              `/${route}`,
              'dropdown-item tab'
            );
            menu.appendChild(menuItem);
          })
          .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
          });
      });
    }
    console.log(fragmentsByHash)
    if (fragmentsByHash) {
      if (properties.fragments && properties.fragments.length > 0) {
        properties.fragments.forEach(function(fragmentHash) {
          var fragmentData = fragmentsByHash[fragmentHash]?.front_matter;
          
          if (fragmentData) {
            var fragmentAnchor = createAnchorElement(
              fragmentData.name || "Resource Not Found",
              `#${fragmentHash}`,
              'dropdown-item tab'
            );
            menu.appendChild(fragmentAnchor);
  
            fragmentAnchor.addEventListener('click', function(event) {
              event.preventDefault();
              window.location.hash = fragmentHash;
            });
          }
        });
      }
    }

    dropdown.appendChild(toggle);
    dropdown.appendChild(menu);

    toggle.addEventListener('click', function() {
      menu.classList.toggle('show');
      toggle.querySelector('.caret').textContent = menu.classList.contains('show') ? '\u25BC' : '\u25B6';
    });

    element.appendChild(dropdown);

    return dropdown;
  }

  function shouldCreateDropdown(properties) {
    return (properties.pages && properties.pages.length > 0) ||
      (properties.fragments && properties.fragments.length > 0);
  }

  function createAnchorElement(textContent, href, className) {
    var anchor = document.createElement('a');
    anchor.className = className;
    anchor.textContent = textContent;
    anchor.href = convertToKebabCase(href);
    return anchor;
  }

  function createToggle(properties) {
    var toggle = document.createElement('div');
    toggle.className = 'tab dropdown-toggle';
    toggle.id = 'dropdownMenu' + (properties.name || '').replace(/\s+/g, '');
    toggle.setAttribute('data-toggle', 'dropdown');
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span class="caret">&#9660;</span> ' + properties.name;
    return toggle;
  }

  function createMenu(toggleId) {
    var menu = document.createElement('div');
    menu.className = 'dropdown-menu show';
    menu.setAttribute('aria-labelledby', toggleId);
    return menu;
  }
}
