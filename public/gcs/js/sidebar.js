
function sidebar(dataParentId, element) {
  var fragmentsData = {};
  var dropdownPropertiesMapping = {};
  var queuedFragmentUpdates = [];

  function shouldCreateDropdown(properties) {
    return (properties.pages && properties.pages.length > 0) ||
      (properties.fragments && properties.fragments.length > 0);
  }

  function createAnchorElement(textContent, href, className) {
    var anchor = document.createElement('a');
    anchor.className = className;
    anchor.textContent = textContent;
    anchor.href = href;
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

  function createDropdownComponent(properties) {
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

    if (properties.fragments && properties.fragments.length > 0) {
      properties.fragments.forEach(function(fragmentHash) {
        var fragmentData = fragmentsData[fragmentHash];
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
        } else {
          queueFragmentUpdate(fragmentHash);
        }
        dropdownPropertiesMapping[fragmentHash] = properties;
      });
    }

    dropdown.appendChild(toggle);
    dropdown.appendChild(menu);

    toggle.addEventListener('click', function() {
      menu.classList.toggle('show');
      toggle.querySelector('.caret').textContent = menu.classList.contains('show') ? '\u25BC' : '\u25B6';
    });
    return dropdown;
  }

  function updateDomElement(action, domElement, item) {
    if (!domElement) {
      console.error("No DOM Element for action: ", action, " and item: ", item);
      return;
    }
    switch (action) {
      case 'create':
        var dropdown = createDropdownComponent(item);
        domElement.appendChild(dropdown);
        processQueuedFragmentUpdates();
        break;
      case 'update':
        const existingItemElement = domElement.querySelector(`#item-${item.id}`);
        if (existingItemElement) {
          updateItemElement(existingItemElement, item);
        }
        break;
      case 'delete':
        const itemToRemove = domElement.querySelector(`#item-${item.id}`);
        if (itemToRemove) {
          domElement.removeChild(itemToRemove);
        }
        break;
      default:
        console.error(`Unsupported action: ${action}`);
    }
  }

  var state = {}
  var isPageReady = false;
  var queuedComponentChanges = [];

  function isDropdownReady(fragmentHash) {
    var properties = dropdownPropertiesMapping[fragmentHash];
    if (!properties) {
      return false;
    }
    var dropdownId = 'dropdown-' + (properties.name || '').replace(/\s+/g, '-');
    var isReady = element.querySelector('#' + dropdownId) !== null;
    return isReady;
  }

  function updateFragmentInSidebar(fragmentHash) {
    var properties = dropdownPropertiesMapping[fragmentHash];

    if (!properties) {
      console.error(`[updateFragmentInSidebar] No properties found for fragmentHash: ${fragmentHash}`);
      return;
    }

    var dropdownId = 'dropdown-' + (properties.name || '').replace(/\s+/g, '-');
    var dropdownElement = element.querySelector('#' + dropdownId);

    if (!dropdownElement) {
      console.error(`[updateFragmentInSidebar] Dropdown element not found for ID: ${dropdownId}`);
      return;
    }

    var menuItem = dropdownElement.querySelector(`a[href="#${fragmentHash}"]`);

    if (!menuItem) {
      // Fragment data should be available at this point
      var fragmentData = fragmentsData[fragmentHash];
      if (fragmentData) {
        menuItem = createAnchorElement(
          fragmentData.name || "Resource Not Found",
          `#${fragmentHash}`,
          'dropdown-item tab'
        );
        dropdownElement.querySelector('.dropdown-menu').appendChild(menuItem);
      } else {
        console.error(`[updateFragmentInSidebar] Fragment data not found for hash: ${fragmentHash}`);
      }
    } else {
      // Update the existing menu item if needed
      var fragmentData = fragmentsData[fragmentHash];
      if (fragmentData && menuItem.textContent !== fragmentData.name) {
        menuItem.textContent = fragmentData.name;
      }
    }
  }

  function queueFragmentUpdate(fragmentHash) {
    if (!queuedFragmentUpdates.includes(fragmentHash)) {
      queuedFragmentUpdates.push(fragmentHash);
    }
  }

  function processQueuedFragmentUpdates() {
    queuedFragmentUpdates.slice().forEach(function(fragmentHash) {
      // Process only if the fragment data is present
      if (isDropdownReady(fragmentHash) && fragmentsData[fragmentHash]) {
        updateFragmentInSidebar(fragmentHash);
        queuedFragmentUpdates = queuedFragmentUpdates.filter(h => h !== fragmentHash);
      }
    });
  }

  function handlePage(data) {
    var action = data?.action;
    var pageData = data?.data;
    if (pageData.pages || pageData.fragments) {
      updateDomElement(action, element, pageData);
    }

    isPageReady = true;
    queuedComponentChanges.forEach(function(change) {
      updateDomElement(change.action, element, change.data);
    });

    queuedComponentChanges = [];
  }

  function handleComponent(data) {
    var action = data?.action;
    var componentData = data?.data;
    if (!shouldCreateDropdown(componentData)) {
      return;
    }
    if (!isPageReady) {
      queuedComponentChanges.push({ action, componentData });
    } else {
      updateDomElement(action, element, componentData);
    }
  }

  function handleFragment(data) {
    var fragmentHash = data?.data?.front_matter?.hash;
    if (fragmentHash) {
      fragmentsData[fragmentHash] = data?.data?.front_matter;
      // Check if the component is ready before calling updateFragmentInSidebar
      if (isDropdownReady(fragmentHash)) {
        updateFragmentInSidebar(fragmentHash);
      } else {
        queueFragmentUpdate(fragmentHash);
      }
    }
  }

  function updateSidebar(newData) {
    for (var key in newData) {
      if (state[key] !== newData[key]) {
        var newDataData = newData[key];
        switch(key) {
          case "page":
            handlePage(newDataData);
            break;
          case "component":
            handleComponent(newDataData);
            break;
          case "fragment":
            handleFragment(newDataData);
            break;
          default:
            console.error(`Unsupported key: ${key}`);
        }
        // Update the current state
        state[key] = newDataData;
      }
    }
  }

  if (dataParentId) {
    PubSub.subscribe(dataParentId, (data) => {
      updateSidebar(data);
    });
  }
}