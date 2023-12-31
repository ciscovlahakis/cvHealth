$(document).ready(function () {
  // Get the user modal
  var userModal = document.getElementById("user-modal");

  // Get the user icon
  var userIcon = document.getElementById("user-icon");

  // Get the sign-in form and its cancel button
  var signInForm = document.getElementById("user-modal-form");
  var signInCancelButton = document.getElementById("user-cancel-button");

  // Get the sign-up button
  var signUpButton = document.getElementById("sign-up-button");

  // Get the sign-out form
  var signOutForm = document.getElementById("sign-out-form");

  // When the user clicks the icon, open the modal
  userIcon.onclick = function () {
    userModal.style.display = "flex";
    var isUserSignedIn = this.getAttribute("data-signed-in");

    if (isUserSignedIn === "true") {
      // If the user is signed in, hide the sign-in and sign-up forms and show the log out form
      signInForm.style.display = "none";
      signUpButton.style.display = "none";
      signOutForm.style.display = "block";
    } else {
      // If the user is not signed in, show the sign-in and sign-up forms and hide the log out form
      signInForm.style.display = "block";
      signUpButton.style.display = "block";
      signOutForm.style.display = "none";
      $('#user-modal-title').text('Sign In');
      $('#user-modal-form input[type=submit]').val('Sign In');
    }

    if (isUserSignedIn === "true") {
      var userId = this.getAttribute("data-user-id");
      var profile_picture = this.getAttribute("data-profile-picture");
      var userImage = document.getElementById("user-image");
      var bucket = "cisco-vlahakis.appspot.com"
      userImage.src = `https://storage.googleapis.com/${bucket}/uploads/${userId}/${profile_picture}`;
    }
  }

  // When the user clicks the cancel button, close the modal
  signInCancelButton.onclick = function () {
    userModal.style.display = "none";
    // Clear form fields
    $('#user-modal-form input[type=text]').val('');
    $('#user-modal-form input[type=password]').val('');
  }

  // When the user clicks the sign-up button, update the form to sign-up
  signUpButton.onclick = function () {
    signInForm.action = "/sign_up";
    $('#user-modal-title').text('Sign Up');
    $('#user-modal-form input[type=submit]').val('Sign Up');
    signInForm.submit();
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == userModal) {
      userModal.style.display = "none";
      // Reset the form to sign-in
      signInForm.action = "/login";
      $('#user-modal-title').text('Sign In');
      $('#user-modal-form input[type=submit]').val('Sign In');
      // Clear form fields
      $('#user-modal-form input[type=text]').val('');
      $('#user-modal-form input[type=password]').val('');
    }
  }
});
