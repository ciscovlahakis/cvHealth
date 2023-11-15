$(document).ready(function () {
  // Get the modal
  var modal = document.getElementById("modal");

  // Get the button that opens the modal
  var btn = document.getElementById("create-btn");

  // Get the element that closes the modal
  var cancelButton = document.getElementById("cancel-button");

  // When the user clicks the button, open the modal 
  btn.onclick = function () {
    modal.style.display = "flex";
    $('#modal-form').attr('action', '/create/' + $('#modal-form').data('resource'));
    $('#modal-title').text('Create ' + $('#modal-form').data('resource'));
    $('#modal-form input[type=submit]').val('Create');
  }

  cancelButton.onclick = function() {
    modal.style.display = "none";
    // Clear form fields
    $('#modal-form input[type=text]').val('');
    $('#modal-form input[type=number]').val('');
    // Clear data attributes
    $('.content-cell').data({});
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
      // Clear form fields
      $('#modal-form input[type=text]').val('');
      $('#modal-form input[type=number]').val('');
      $('.content-cell').data({});
    }
  }

  $('.edit-link').on('click', function(event) {
    event.preventDefault();
    var id = $(this).data('id');
    $('#modal-form input[name=id]').val(id);
  
    // Find the row that the edit button was clicked on
    var row = $('.row[data-id="' + id + '"]');

  
    $('#modal-form input[type=text]').each(function() {
      var fieldName = $(this).attr('name');
      // Get the data from the corresponding cell in the row
      var value = row.find('.content-cell[data-' + fieldName + ']').text();
      $(this).val(value);
    });
  
    $('#modal-form input[type=number]').each(function() {
      var fieldName = $(this).attr('name');
      // Get the data from the corresponding cell in the row
      var value = row.find('.content-cell[data-' + fieldName + ']').text();
      $(this).val(value);
    });
  
    $('#modal-form').attr('action', '/update/' + $('#modal-form').data('resource'));
    $('#modal-title').text('Update ' + $('#modal-form').data('resource'));
    $('#modal-form input[type=submit]').val('Edit')
    modal.style.display = "flex";
  });
});
