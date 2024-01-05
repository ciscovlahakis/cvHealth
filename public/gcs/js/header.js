
function header(_, dataId, dataParentId) {
  const pagePath = [dataParentId, "page"];
  on(pagePath, async newValue => {
    const { collection, route } = newValue;
    if (!collection) return;
    setUpSearch(collection);
    initialSearch(collection);
    await updateBreadcrumbs(route, newValue);
  }, dataId);

  // Function to set up the search input event listener
  function setUpSearch(indexName) {
    const searchInput = document.querySelector("input[name='search']");
    const activityIndicator = document.getElementById('activityIndicator');
    searchInput?.addEventListener("keyup", function(event) {
      var searchTerm = event.target.value.trim();
      if (indexName && indexName.trim() !== '') {
        var url = "/search/" + indexName + (searchTerm ? "?term=" + encodeURIComponent(searchTerm) : "");
        performSearch(url, searchTerm);
      } else {
        console.error("indexName is not set correctly in the JavaScript code.");
      }
    });
  }

  // Function to perform the initial fetch of search results
  function initialSearch(indexName) {
    if (indexName && indexName.trim() !== '') {
      performSearch("/search/" + indexName, "");
    } else {
      console.error("indexName is not set correctly in the JavaScript code.");
    }
  }

  async function buildBreadcrumbs(route, pageData) {
    var routeComponents = route === "/" ? [""] : ["/"].concat(route.split("/").slice(1));
    var breadcrumbs = [];

    for (var index = 0; index < routeComponents.length; index++) {
      var component = routeComponents[index];
      var breadcrumbRoute = routeComponents.slice(0, index + 1).join("/") || "/";
      
      var breadcrumbPageData = null;
      if (component === pageData.route) {
          breadcrumbPageData = pageData;
      } else {
        try {
          var response = await fetch(`/api/collection/pages?field=route&value=${breadcrumbRoute}`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          breadcrumbPageData = await response.json();
        } catch (error) {
          console.error('There has been a problem with your fetch operation:', error);
        }
      }
      if (breadcrumbPageData) {
        const { name, icon, imgSrc, route } = breadcrumbPageData;
        breadcrumbs.push({ name, icon, imgSrc, route });
      }
    }
    
    return breadcrumbs;
  }

  async function updateBreadcrumbs(data) {
    var breadcrumbs = await buildBreadcrumbs(window.location.pathname, data);
    var breadcrumbContainer = document.getElementById('breadcrumbs');
    breadcrumbContainer.innerHTML = ''; // Clear existing breadcrumbs

    breadcrumbs.forEach(function(breadcrumb) {
      var breadcrumbElement = document.createElement('a');
      breadcrumbElement.href = breadcrumb.route || '/';
      breadcrumbElement.className = 'clickable';
      
      var breadcrumbContent = document.createElement('span');
      breadcrumbContent.className = 'breadcrumb breadcrumb-content';

      const { name, icon, imgSrc } = breadcrumb;
      
      // Check if the breadcrumb has an image source
      if (imgSrc) {
        var img = document.createElement('img');
        img.src = imgSrc;
        img.alt = 'Thumbnail';
        img.className = 'breadcrumb-thumbnail';
        if (name) {
          img.className += ' breadcrumb-thumbnail-with-name';
        }
        breadcrumbContent.appendChild(img);
      }
      // If not, check if the breadcrumb has an icon class
      else if (icon) {
        var iconElement = document.createElement('i');
        iconElement.className = icon + ' breadcrumb-icon';
        if (name) {
            iconElement.className += ' breadcrumb-icon-with-name';
        }
        breadcrumbContent.appendChild(iconElement);
      }
      // If no image or icon, use a placeholder image
      else {
        var placeholderImg = document.createElement('img');
        placeholderImg.src = 'https://via.placeholder.com/150';
        placeholderImg.alt = '';
        placeholderImg.className = 'breadcrumb-thumbnail';
        if (name) {
          placeholderImg.className += ' breadcrumb-thumbnail-with-name';
        }
        breadcrumbContent.appendChild(placeholderImg);
      }
      
      // Check if the breadcrumb has a name
      if (name) {
        var nameElement = document.createElement('span');
        nameElement.textContent = name;
        breadcrumbContent.appendChild(nameElement);
      }
      
      // Append the breadcrumb content to the breadcrumb element
      breadcrumbElement.appendChild(breadcrumbContent);
      // Append the breadcrumb element to the container
      breadcrumbContainer.appendChild(breadcrumbElement);
    });
  }
}
