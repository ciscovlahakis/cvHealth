$(document).ready(function() {
  // Get the modal
  var modal = document.getElementById("modal");

  // Get the button that opens the modal
  var btn = document.getElementById("create-btn");

  // Get the element that closes the modal
  var cancelButton = document.getElementById("cancel-button");

  // When the user clicks the button, open the modal 
  btn.onclick = function() {
    modal.style.display = "flex";
  }

  // When the user clicks on the cancel button, close the modal
  cancelButton.onclick = function() {
    modal.style.display = "none";
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
});
