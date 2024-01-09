$(document).ready(function () {
  // Sort the rows based on the 'position' data attribute
  var rows = $('.grid-row.sortable-row');
  rows.sort(function (a, b) {
    return $(a).data('position') - $(b).data('position');
  });
  // Append the sorted rows to the table
  $('.grid-table').append(rows);

  var enableMove = $('#enableMove').val() === 'true';
  if (enableMove) {
    $('.grid-table').sortable({
      handle: ".drag-handle",
      items: '.sortable-row',
      update: function (event, ui) {
        // Fetch all rows
        var rows = $('.grid-row.sortable-row');
        // Iterate over each row
        rows.each(function (index, row) {
          // Calculate the new position
          var newPosition = index + 1;
          // Fetch the id and resource from the row
          var id = $(row).data('id');
          var resource = $(row).data('resource');
          // Update the position
          updatePosition(id, newPosition, resource);
        });
      }
    });
  }
});

function updatePosition(id, newPosition, resource) {
  $.ajax({
    url: '/update_position',
    type: 'POST',
    data: {
      id: id,
      position: newPosition,
      resource: resource
    },
    success: function (response) {
      console.log(response);
    }
  });
}
