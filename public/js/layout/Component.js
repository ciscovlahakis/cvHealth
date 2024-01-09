import { fetchAndUpdateState } from "../helpers/fetchingHelpers.js";
import { 
  convertToKebabCase,
  capitalize
} from "../utils/stringUtils.js";

export default class Component {
  constructor(name = null, route = null, parentElement = null) {
    this.name = name;
    this.route = route;
    this.element = null;
    this.parentElement = parentElement;
  }

  async render() {
    await this.fetchComponentResources();
    await this.renderSubComponents();
    await this.insertIntoParent();
    this.onRenderComplete();
  }

  onRenderComplete() {
    // can be overridden in subclass
  }

  async fetchComponentResources() {
    var dbPath = `db/components/`;
    if (this.route) dbPath += `route/${encodeURIComponent(this.route)}`;
    else if (this.name) dbPath += `name/${this.name}`;
    else dbPath = null;

    try {
      const componentData = await fetchAndUpdateState(dbPath);
      const { name, route, path } = componentData;

      this.name = name;
      this.route = route;

      try {
        const fileName = convertToKebabCase(this.getIdentifier());

        const htmlPath = `/html/${fileName}`;
        const htmlResponse = await fetch(htmlPath);
        if (!htmlResponse.ok) {
          throw new Error(
            `HTTP error fetching HTML! status: ${htmlResponse.status}`
          );
        }

        const componentHTML = await htmlResponse.text();
        const template = document.createElement("template");
        template.innerHTML = componentHTML.trim();
        this.element = template.content.firstChild;

        this.element.id = path;

        const cssPath = `/css/components/${fileName}.css`;
        const cssResponse = await fetch(cssPath);
        if (cssResponse.ok && cssResponse.headers.get("Content-Type").includes("text/css")) {
          // CSS file exists and is valid, append it to the document
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = cssPath;
          document.head.appendChild(link);
        } else {
          console.log(`CSS file not found for: ${fileName}`);
        }
      } catch (error) {
        throw new Error(
          `HTTP error fetching data for component! status: ${error.message}`
        );
      }
    } catch (error) {
      console.error(`Error fetching resources for component: ${this.getIdentifier()}`, error);
    }
  }

  async renderSubComponents() {
    if (!this.element) {
      console.error("Element for:", this.getIdentifier(), "does not exist.");
      return;
    }
    const components = this.element.querySelectorAll("[data-component]");
    for (const comp of components) {
      const componentName = comp.getAttribute("data-component");
      if (!componentName) {
        console.error(componentName, "is not a data-component in:", this.getIdentifier());
        return;
      }
      const moduleName = capitalize(componentName);
      try {
        const CompClass = await this.getModule(moduleName);
        const compInstance = new CompClass(componentName, null, this.element); // this.element becomes parentElement
        await compInstance.render();
      } catch (error) {
        console.error("Failed to load module:", moduleName, "for", this.getIdentifier(), error);
      }
    }
  }

  async insertIntoParent() {
    if (!this.parentElement) return;

    // Find the placeholder for this specific instance of the component
    const placeholder = this.parentElement.querySelector(`[data-component='${this.name}']`);
    if (!placeholder) return;

    // Save the existing children of the placeholder
    const existingChildren = Array.from(placeholder.childNodes);

    // Replace the placeholder with this component
    placeholder.replaceWith(this.element);

    // Append the saved children to the data-children container of this component
    const dataChildrenContainer = this.element.querySelector("[data-children]");
    if (!dataChildrenContainer) return;

    existingChildren.forEach((child) =>
      dataChildrenContainer.appendChild(child)
    );
  }

  async getModule(moduleName) {
    const module = await import(`/js/components/${moduleName}.js`);
    return module.default;
  }

  getIdentifier() {
    return this.name || this.route;
  }
}
