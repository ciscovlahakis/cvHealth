
class ErrorHandler {
  constructor(element) {
    this.element = element;
  }

  listen() {
    onStateChange('errors', (newError) => {
      this.handleErrors(newError);
    }, "added");
  }

  handleErrors(errors) {
    console.error(errors);
    this.element.innerText = errors.join('\n');
    this.element.style.display = 'block';
  }

  clearError() {
    this.element.innerText = '';
    this.element.style.display = 'none';
  }
}
