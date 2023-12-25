
function header(dataParentId, element) {
  var searchInput = document.querySelector("input[name='search']");
  var activityIndicator = document.getElementById('activityIndicator');
  var indexName;

  // Function to set up the search input event listener
  function setUpSearch() {
    searchInput.addEventListener("keyup", function(event) {
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
  function initialSearch() {
    if (indexName && indexName.trim() !== '') {
      performSearch("/search/" + indexName, "");
    } else {
      console.error("indexName is not set correctly in the JavaScript code.");
    }
  }

  async function build_breadcrumbs(route, page_data) {
    var route_components = route === "/" ? [""] : ["/"].concat(route.split("/").slice(1));
    var breadcrumbs = [];

    for (var index = 0; index < route_components.length; index++) {
      var component = route_components[index];
      var breadcrumb_route = route_components.slice(0, index + 1).join("/") || "/";
      
      var breadcrumb_page_data = null;
      if (component === page_data.route) {
          breadcrumb_page_data = page_data;
      } else {
        try {
          var response = await fetch(`/api/collection/pages?field=route&value=${breadcrumb_route}`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          breadcrumb_page_data = await response.json();
        } catch (error) {
          console.error('There has been a problem with your fetch operation:', error);
        }
      }
      if (breadcrumb_page_data) {
        const { title, icon, img_src, route } = breadcrumb_page_data;
        breadcrumbs.push({ title, icon, img_src, route });
      }
    }
    
    return breadcrumbs;
  }

  async function updateBreadcrumbs(data) {
    var breadcrumbs = await build_breadcrumbs(window.location.pathname, data);
    var breadcrumbContainer = document.getElementById('breadcrumbs');
    breadcrumbContainer.innerHTML = ''; // Clear existing breadcrumbs

    breadcrumbs.forEach(function(breadcrumb) {
      var breadcrumbElement = document.createElement('a');
      breadcrumbElement.href = breadcrumb.route || '/';
      breadcrumbElement.className = 'clickable';
      
      var breadcrumbContent = document.createElement('span');
      breadcrumbContent.className = 'breadcrumb breadcrumb-content';

      const { title, icon, img_src } = breadcrumb;
      
      // Check if the breadcrumb has an image source
      if (img_src) {
        var img = document.createElement('img');
        img.src = img_src;
        img.alt = 'Thumbnail';
        img.className = 'breadcrumb-thumbnail';
        if (title) {
          img.className += ' breadcrumb-thumbnail-with-title';
        }
        breadcrumbContent.appendChild(img);
      }
      // If not, check if the breadcrumb has an icon class
      else if (icon) {
        var iconElement = document.createElement('i');
        iconElement.className = icon + ' breadcrumb-icon';
        if (title) {
            iconElement.className += ' breadcrumb-icon-with-title';
        }
        breadcrumbContent.appendChild(iconElement);
      }
      // If no image or icon, use a placeholder image
      else {
        var placeholderImg = document.createElement('img');
        placeholderImg.src = 'https://via.placeholder.com/150';
        placeholderImg.alt = '';
        placeholderImg.className = 'breadcrumb-thumbnail';
        if (title) {
          placeholderImg.className += ' breadcrumb-thumbnail-with-title';
        }
        breadcrumbContent.appendChild(placeholderImg);
      }
      
      // Check if the breadcrumb has a title
      if (title) {
        var titleElement = document.createElement('span');
        titleElement.textContent = title;
        breadcrumbContent.appendChild(titleElement);
      }
      
      // Append the breadcrumb content to the breadcrumb element
      breadcrumbElement.appendChild(breadcrumbContent);
      // Append the breadcrumb element to the container
      breadcrumbContainer.appendChild(breadcrumbElement);
    });
  }

  if (dataParentId) {
    PubSub.subscribe(dataParentId, async function(data) {
      var collection = data?.page?.data?.collection;
      if (!collection) return;
      indexName = collection;
      setUpSearch();
      initialSearch();
      await updateBreadcrumbs(data);
    });
  }
}
