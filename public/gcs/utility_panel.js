function initializeUtilityPanel() {
  var utilityPanel = document.querySelector('.utility-panel');
  var utilityContent = utilityPanel.querySelector('.utility-content');

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
        utilityPanel.classList.remove('utility-panel');
        utilityPanel.classList.add('modal');
        utilityContent.classList.add('modal-content');
        toggleDisplay(utilityPanel, 'flex');
        utilityPanel.style.height = ''; // Clear any inline height style
        toggleDisplay(content, 'block'); // Ensure content is visible
      } else {
        // Collapsing from modal to utility panel
        utilityPanel.classList.add('utility-panel');
        utilityPanel.classList.remove('modal');
        utilityContent.classList.remove('modal-content');
        toggleDisplay(utilityPanel, 'block');
        utilityPanel.style.height = ''; // Clear any inline height style
      }
    } else if (event.target.id === 'minimize') {
      var isContentHidden = content.style.display === 'none';
      toggleDisplay(content, isContentHidden ? 'block' : 'none');
      utilityPanel.style.height = isContentHidden ? '400px' : 'auto';
      
      // If the utility panel is in the modal state, revert it back to the utility panel state
      if (utilityPanel.classList.contains('modal')) {
        utilityPanel.classList.add('utility-panel');
        utilityPanel.classList.remove('modal');
        utilityContent.classList.remove('modal-content');
      }
      toggleDisplay(utilityPanel, 'block'); // This might be redundant, but ensures visibility
    }
  });

  // Add an event listener specifically to the utility content to stop propagation
  if (utilityContent) {
    utilityContent.addEventListener('click', function(event) {
      event.stopPropagation(); // Prevent clicks inside the content from closing it
    });
  }

  document.addEventListener('click', function(event) {
    // Check if the utility panel is in a modal state
    if (utilityPanel.classList.contains('modal')) {
      // Check if the click is directly on the modal backdrop (`.modal`), not its children
      if (event.target.classList.contains('modal')) {
        // Minimize the utility panel
        var content = utilityPanel.querySelector('[data-yield]');
        toggleDisplay(content, 'none'); // Hide the content
        utilityPanel.style.height = 'auto'; // Reset the height for the minimized state
        utilityPanel.classList.remove('modal');
        utilityContent.classList.remove('modal-content');
        utilityPanel.classList.add('utility-panel'); // Add back the utility-panel class
      }
    }
  }, true);
}

window.firebaseInitialized
.then(initializeUtilityPanel)
.catch(function(error) {
  console.error('Error during Firebase initialization:', error);
});
