
function utilityPanel() {
  var body = document.body;

  body.addEventListener('click', function(event) {
    // Check if the clicked element is the 'close' button
    if (event.target.id === 'close') {
      var utilityPanel = document.querySelector('.utility-panel');
      if (utilityPanel) {
        utilityPanel.style.display = 'none';
      }
    }

    // Check if the clicked element is the 'expand' button
    if (event.target.id === 'expand') {
      var utilityPanel = document.querySelector('.utility-panel');
      if (utilityPanel) {
        utilityPanel.classList.toggle('expanded');
        if (utilityPanel.classList.contains('expanded')) {
          // Expand the utility panel
          utilityPanel.style.width = '100%';
          utilityPanel.style.height = '100%';
          utilityPanel.style.top = '0';
          utilityPanel.style.right = '0';
          utilityPanel.style.bottom = '0';
          utilityPanel.style.left = '0';
        } else {
          // Minimize the utility panel
          utilityPanel.style.width = '300px';
          utilityPanel.style.height = '400px';
          utilityPanel.style.bottom = '20px';
          utilityPanel.style.right = '20px';
        }
      }
    }

    // Check if the clicked element is the 'minimize' button
    if (event.target.id === 'minimize') {
      var utilityPanel = document.querySelector('.utility-panel');
      var content = utilityPanel ? utilityPanel.querySelector('[data-yield]') : null;
      if (content) {
        if (content.style.display !== 'none') {
          content.style.display = 'none';
          utilityPanel.style.height = 'auto';
        } else {
          content.style.display = 'block';
          utilityPanel.style.height = '400px';
        }
      }
    }
  });
}

window.firebaseInitialized
  .then(utilityPanel)
  .catch(function(error) {
    console.error('Error during Firebase initialization:', error);
  });
