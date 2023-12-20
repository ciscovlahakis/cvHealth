const States = {
  ORIGINAL: 'original',
  EXPANDED: 'expanded'
};

function initializeUtilityPanel() {
  var utilityPanel = document.querySelector('.utility-panel');
  var lastState = States.ORIGINAL; // This will track the last non-minimized state

  // Helper function to toggle display styles
  function toggleDisplay(element, displayStyle) {
    element.style.display = displayStyle;
  }

  document.body.addEventListener('click', function(event) {
    var content = utilityPanel?.querySelector('[data-yield]');

    if (event.target.id === 'close') {
      toggleDisplay(utilityPanel, 'none');
    }
    else if (event.target.id === 'expand') {
      var isExpanded = lastState === States.EXPANDED;
      if (!isExpanded) {
        // Expanding to expanded-utility
        utilityPanel.classList.add('expanded-utility');
        utilityPanel.classList.remove('utility-panel');
        lastState = States.EXPANDED; // Remember the expanded state
      } else {
        // Collapsing to utility panel
        utilityPanel.classList.add('utility-panel');
        utilityPanel.classList.remove('expanded-utility');
        lastState = States.ORIGINAL; // Revert back to the original state
      }
      toggleDisplay(utilityPanel, 'block');
      toggleDisplay(content, 'block'); // Ensure content is visible
      utilityPanel.style.height = ''; // Clear any inline height style
    }
    else if (event.target.id === 'minimize') {
      var isContentVisible = content.style.display !== 'none';
      if (isContentVisible) {
        // Minimize the content
        toggleDisplay(content, 'none');
        utilityPanel.classList.remove('expanded-utility');
        utilityPanel.classList.add('utility-panel');
        utilityPanel.style.height = 'auto';
        // Do not change lastState here, it should remember the last expanded state
      } else {
        // Restore to the last non-minimized state
        toggleDisplay(content, 'block');
        if (lastState === States.EXPANDED) {
          utilityPanel.classList.add('expanded-utility');
          utilityPanel.classList.remove('utility-panel');
          utilityPanel.style.height = ''; // Remove inline height style
        } else {
          // If there's another non-minimized state to consider, handle it here
          utilityPanel.classList.add('utility-panel');
          utilityPanel.classList.remove('expanded-utility');
          utilityPanel.style.height = '400px'; // Or whatever the original height is
        }
      }
    }
  });
}

window.firebaseInitialized
.then(initializeUtilityPanel)
.catch(function(error) {
  console.error('Error during Firebase initialization:', error);
});
