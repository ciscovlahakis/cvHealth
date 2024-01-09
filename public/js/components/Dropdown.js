
class Dropdown {
  constructor(parentElement, component) {
    this.parentElement = parentElement;
    this.component = component;
    this.element = null;
    this.initialize();
    this.updateComponents();
  }

  initialize() {
    this.element = document.createElement("div");
    this.element.className = "dropdown";
    this.element.id = "dropdown-" + (this.component.name || "").replace(/\s+/g, "-");

    const toggle = this.createToggle(this.component);
    const menu = this.createMenu(toggle.id);

    this.element.appendChild(toggle);
    this.element.appendChild(menu);

    toggle.addEventListener("click", () => {
      menu.classList.toggle("show");
      toggle.querySelector(".caret").textContent = menu.classList.contains(
        "show"
      )
        ? "\u25BC"
        : "\u25B6";
    });

    this.parentElement.appendChild(this.element);

    onStateChange("components", (newComponent) => {
      if (this.isOption(newComponent)) {
        new Option(this.element, newComponent);
      }
    }, "added");

    onStateChange(`components.${this.component.id}`, (updatedComponent) => {
      this.updateComponent(updatedComponent);
    }, 'modified');
  
    onStateChange(`components.${this.component.id}`, () => {
      this.deleteSelf();
    }, 'removed');
  }

  isOption(component) {
    return component.parent === this.component.name;
  }

  updateComponent(component){
    console.log("Deleting dropdown: ",component, this.component);
  }

  deleteSelf() {
    console.log("Deleting dropdown: ", this.component);
  }

  updateComponents() {
    setupFirestoreListener(
      "components", 
      ["parent", "==", this.component.name], 
      (newComponents) => {
        newComponents.forEach(component => {
          const componentObj = { [component.id]: component };
          console.log(componentObj);
          upsertDoc("components", componentObj);
        });
      }
    );
  }

  createToggle(component) {
    const toggle = document.createElement("div");
    toggle.className = "tab dropdown-toggle";
    toggle.id = "dropdownMenu" + (component.name || "").replace(/\s+/g, "");
    toggle.setAttribute("data-toggle", "dropdown");
    toggle.setAttribute("aria-haspopup", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = '<span class="caret">&#9660;</span> ' + component.name;
    return toggle;
  }

  createMenu(toggleId) {
    const menu = document.createElement("div");
    menu.className = "dropdown-menu show";
    menu.setAttribute("aria-labelledby", toggleId);
    return menu;
  }
}
