function initializeModal() {
  // Function to hide the modal
  function hideModal() {
    var modal = document.querySelector('.modal');
    if (modal && modal.style.display === 'flex') {
      modal.style.display = 'none';
    }
  }

  // Function to show the modal with the specified action and id
  function showModal(action, id) {
    var modal = document.querySelector('.modal');
    if (modal) {
      modal.style.display = "flex";
      var form = document.getElementById('modal-form');
      form.setAttribute('action', action + id);
      var modalTitle = document.getElementById('modal-title');
      var createBtn = document.getElementById('create-btn');
      modalTitle.textContent = action.includes('/create/') ? createBtn.textContent : 'Update ' + createBtn.textContent.replace('Create ', '');
      form.querySelector('input[type=submit]').value = action.includes('/create/') ? 'Create' : 'Edit';
    }
  }

  // Populate the edit form with values based on the provided id
  function populateEditForm(id) {
    var form = document.getElementById('modal-form');
    form.querySelector('input[name=id]').value = id;

    form.querySelectorAll('input[type=text], input[type=number]').forEach(function(input) {
      var fieldName = input.name;
      var value = document.querySelector('.content-cell[data-' + fieldName + '][data-row-id="' + id + '"]').textContent.trim();
      input.value = value;
    });
  }

  // Event delegation for dynamically added elements
  document.body.addEventListener('click', function(event) {
    if (event.target.id === 'create-btn') {
      showModal('/create/', event.target.dataset.resource);
    } else if (event.target.id === 'cancel-button') {
      hideModal();
    } else if (event.target.classList.contains('edit-link')) {
      event.preventDefault();
      populateEditForm(event.target.dataset.id);
      showModal('/update/', document.getElementById('modal-form').dataset.resource);
    }
  });

  // Event listener to close the modal when clicking outside of its content
  window.addEventListener('click', function(event) {
    var modal = document.querySelector('.modal');

    // Check if the click is on the modal overlay and outside the modal content
    if (modal && modal.style.display === 'flex' && event.target === modal) {
      hideModal();
    }
  });

  // Prevent clicks within the modal content from closing the modal
  var modalContent = document.querySelector('.modal-content');
  if (modalContent) {
    modalContent.addEventListener('click', function(event) {
      event.stopPropagation(); // Prevent the click from propagating to the window
    });
  }
}

window.firebaseInitialized
  .then(initializeModal)
  .catch(function(error) {
    console.error('Error during Firebase initialization:', error);
  });
