function initializeUtilityPanel() {
  var utilityPanel = document.querySelector('.utility-panel');
  var utilityContent = utilityPanel.querySelector('.utility-content');
  var lastState = 'original'; // This will track the last non-minimized state

  // Helper function to toggle display styles
  function toggleDisplay(element, displayStyle) {
    element.style.display = displayStyle;
  }

  document.body.addEventListener('click', function(event) {
    var content = utilityPanel.querySelector('[data-yield]');

    if (event.target.id === 'close') {
      toggleDisplay(utilityPanel, 'none');
    } else if (event.target.id === 'expand') {
      var isExpanded = utilityPanel.classList.contains('modal');
      if (!isExpanded) {
        // Expanding to modal
        utilityPanel.classList.add('modal');
        utilityContent.classList.add('modal-content');
        utilityPanel.classList.remove('utility-panel');
        lastState = 'expanded'; // Remember the expanded state
      } else {
        // Collapsing to utility panel
        utilityPanel.classList.add('utility-panel');
        utilityContent.classList.remove('modal-content');
        utilityPanel.classList.remove('modal');
        lastState = 'original'; // Revert back to the original state
      }
      toggleDisplay(utilityPanel, 'block');
      toggleDisplay(content, 'block'); // Ensure content is visible
      utilityPanel.style.height = ''; // Clear any inline height style
    } else if (event.target.id === 'minimize') {
      var isContentVisible = content.style.display !== 'none';
      if (isContentVisible) {
        // Minimize the content
        toggleDisplay(content, 'none');
        utilityPanel.classList.remove('modal');
        utilityContent.classList.remove('modal-content');
        utilityPanel.classList.add('utility-panel');
        utilityPanel.style.height = 'auto';
        // Do not change lastState here, it should remember the last expanded state
      } else {
        // Restore to the last non-minimized state
        toggleDisplay(content, 'block');
        if (lastState === 'expanded') {
          utilityPanel.classList.add('modal');
          utilityContent.classList.add('modal-content');
          utilityPanel.classList.remove('utility-panel');
          utilityPanel.style.height = ''; // Remove inline height style
        } else {
          // If there's another non-minimized state to consider, handle it here
          utilityPanel.classList.add('utility-panel');
          utilityContent.classList.remove('modal-content');
          utilityPanel.classList.remove('modal');
          utilityPanel.style.height = '400px'; // Or whatever the original height is
        }
      }
    }
  });

  // Add an event listener specifically to the utility content to stop propagation
  utilityContent.addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent clicks inside the content from closing it
  });

  // Event listener for clicks outside the modal to minimize it
  document.addEventListener('click', function(event) {
    var isModal = utilityPanel.classList.contains('modal');
    var isClickInsideUtilityContent = utilityContent.contains(event.target);
  
    if (isModal && !isClickInsideUtilityContent && event.target.id !== 'expand' && event.target.id !== 'minimize') {
      // Minimize the utility panel if it's expanded and the click is outside
      toggleDisplay(utilityContent, 'none');
      utilityPanel.classList.add('utility-panel');
      utilityContent.classList.remove('modal-content');
      utilityPanel.classList.remove('modal');
      utilityPanel.style.height = 'auto';
    }
  }, true);
}

window.firebaseInitialized
.then(initializeUtilityPanel)
.catch(function(error) {
  console.error('Error during Firebase initialization:', error);
});
