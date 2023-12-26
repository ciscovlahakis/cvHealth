
function editItems() {
  document.body.addEventListener('click', function(event) {
    row.addEventListener('click', function() {
      editItem(this.dataset.id); // Pass the ID of the clicked row to the editItem function
    });
    
    function editItem(id) {
      getItemDataById(id).then(function(itemData) {
        // Assuming you have a div with an ID where the form is to be inserted
        var formContainer = document.querySelector('#edit-item-form-container');

        page_data = {};
    
        // Update the data-props attribute with the fetched item data
        formContainer.setAttribute('data-props', JSON.stringify({
          form_mode: 'edit',
          action_url: '/update/' + page_data.collection + '/' + itemData.id,
          item_data: itemData
        }).replace(/"/g, '&quot;'));
    
        // Now that the form is updated, display it as an overlay
        document.getElementById('edit-items-form').style.display = 'block';
    
        // You might need a function to populate the form fields with itemData
        populateEditForm(itemData);
      }).catch(function(error) {
        // Handle the error, perhaps show a user-friendly message
        console.error('Error fetching item data:', error);
      });
    }
    
    function populateEditForm(data) {
      // Assuming you have a form with inputs that match the data fields
      // For each field in the data, find the corresponding input and set its value
      for (var key in data) {
        var input = document.querySelector('#edit-items-form [name="' + key + '"]');
        if (input) {
          input.value = data[key];
        }
      }
    }
    
    function getItemDataById(id) {
      // Find the row with the matching ID
      var row = document.querySelector('[data-id="' + id + '"]');
      
      // Assuming each cell in the row has data attributes with the item's data
      var cells = row.querySelectorAll('.content-cell');
      var itemData = {};
      
      cells.forEach(function(cell) {
        // The data attribute name matches the item's keys
        var key = cell.dataset.key; // Make sure to set this data-key attribute when creating the row
        var value = cell.textContent; // Or retrieve the value from another data attribute if needed
        itemData[key] = value;
      });
    
      return itemData;
    }
    
    function closeEditForm() {
      document.getElementById('edit-items-form').style.display = 'none';
    }
  });
}
