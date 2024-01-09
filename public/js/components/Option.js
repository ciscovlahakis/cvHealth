
class Option {
  constructor(parentElement, component) {
    this.parentElement = parentElement;
    this.component = component;
    this.element = null;
    this.initialize();
  }

  initialize() {
    this.element = this.createAnchorElement(this.component.name, this.component.href, "dropdown-item");
    this.parentElement.appendChild(this.element);

    onStateChange(`components.${this.component.id}`, (updatedComponent) => {
      this.updateComponent(updatedComponent);
    }, 'modified');
  
    onStateChange(`components.${this.component.id}`, () => {
      this.deleteSelf();
    }, 'removed');
  }

  updateComponent(component){
    console.log("Updating option: ",component, this.component);
  }

  deleteSelf() {
    console.log("Deleting option: ", this.component);
  }

  createAnchorElement(textContent, href, className) {
    var anchor = document.createElement("a");
    anchor.className = className;
    anchor.textContent = textContent;
    anchor.href = convertToKebabCase(href);
    return anchor;
  }
}
