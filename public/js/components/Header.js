
class Header extends Component {
  constructor() {
    super();
    this.init();
  }

  async init() {
    on(this.parentPath, async newValue => {
      const { collection } = newValue;
      if (!collection) return;
      this.setUpSearch(collection);
      this.initialSearch(collection);
      const route = getCurrentRoute();
      await this.updateBreadcrumbs(route, newValue);
    }, this.path);
  }

  setUpSearch(indexName) {
    const searchInput = document.querySelector("input[name='search']");
    const activityIndicator = document.getElementById('activityIndicator');
    searchInput?.addEventListener("keyup", event => {
      var searchTerm = event.target.value.trim();
      if (indexName && indexName.trim() !== '') {
        var url = "/search/" + indexName + (searchTerm ? "?term=" + encodeURIComponent(searchTerm) : "");
        this.performSearch(url, searchTerm);
      } else {
        console.error("indexName is not set correctly in the JavaScript code.");
      }
    });
  }

  initialSearch(indexName) {
    if (indexName && indexName.trim() !== '') {
      this.performSearch("/search/" + indexName, "");
    } else {
      console.error("indexName is not set correctly in the JavaScript code.");
    }
  }

  async buildBreadcrumbs(route, pageData) {
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

  async updateBreadcrumbs(data) {
    var breadcrumbs = await this.buildBreadcrumbs(window.location.pathname, data);
    var breadcrumbContainer = document.getElementById('breadcrumbs');
    breadcrumbContainer.innerHTML = ''; // Clear existing breadcrumbs

    breadcrumbs.forEach(breadcrumb => {
      var breadcrumbElement = document.createElement('a');
      breadcrumbElement.href = breadcrumb.route || '/';
      breadcrumbElement.className = 'clickable';
      
      var breadcrumbContent = document.createElement('span');
      breadcrumbContent.className = 'breadcrumb breadcrumb-content';

      const { name, icon, imgSrc } = breadcrumb;
      
      // Add image or icon to breadcrumb
      if (imgSrc) {
        var img = this.createImgElement(imgSrc, 'Thumbnail', name);
        breadcrumbContent.appendChild(img);
      } else if (icon) {
        var iconElement = this.createIconElement(icon, name);
        breadcrumbContent.appendChild(iconElement);
      } else {
        var placeholderImg = this.createImgElement('https://via.placeholder.com/150', '', name);
        breadcrumbContent.appendChild(placeholderImg);
      }

      // Add name to breadcrumb
      if (name) {
        var nameElement = document.createElement('span');
        nameElement.textContent = name;
        breadcrumbContent.appendChild(nameElement);
      }

      // Append breadcrumb content and element to container
      breadcrumbElement.appendChild(breadcrumbContent);
      breadcrumbContainer.appendChild(breadcrumbElement);
    });
  }

  createImgElement(src, alt, name) {
    var img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = 'breadcrumb-thumbnail';
    if (name) {
      img.className += ' breadcrumb-thumbnail-with-name';
    }
    return img;
  }

  createIconElement(iconClass, name) {
    var iconElement = document.createElement('i');
    iconElement.className = iconClass + ' breadcrumb-icon';
    if (name) {
        iconElement.className += ' breadcrumb-icon-with-name';
    }
    return iconElement;
  }
}
