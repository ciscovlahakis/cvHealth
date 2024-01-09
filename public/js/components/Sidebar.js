
class Sidebar extends Component {
  constructor() {
    super();
    this.initialize();
  }

  initialize() {
    onStateChange("components", (newComponent) => {
      new Dropdown(this.element, newComponent);
    }, "added");
  }
}
