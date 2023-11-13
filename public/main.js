let modal = document.getElementById('meal-event-modal');
let createButton = document.getElementById('create-button');
let cancelButton = document.getElementById('cancel-button');

createButton.addEventListener('click', function() {
  modal.style.display = 'block';
});

cancelButton.addEventListener('click', function() {
  modal.style.display = 'none';
});

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
      modal.style.display = 'none';
  }
}
