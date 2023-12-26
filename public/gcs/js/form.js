
function form(dataParentId, element) {
  const state = {};
  
  PubSub.subscribe(dataParentId, function(data) {
    Object.assign(state, data);
    const {
      collection,
      fields,
      form_mode,
      item_data
    } = state;

    const action_url = form_mode === "new" ? "/create/" : "/edit/" + collection;
    element.action = action_url; // Set form action URL

    // Clear previous fields (if any)
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }

    element.classList.add('form-container');

    // Create and insert form contents
    const header = document.createElement('h2');
    header.textContent = form_mode === "edit" ? "Edit Item" : "Add Item";
    element.appendChild(header);

    // Generate form fields
    (fields || []).forEach((field) => {
      if (field.editable) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const label = document.createElement('label');
        label.htmlFor = field.name;
        label.textContent = field.title || '';
        formGroup.appendChild(label);

        const input = document.createElement('input');
        input.type = 'text'; // Assuming the input type is text
        input.id = field.name;
        input.name = field.name;
        input.value = item_data && item_data[field.name] ? item_data[field.name] : '';
        input.required = form_mode === 'new';
        formGroup.appendChild(input);

        element.appendChild(formGroup);
      }
    });

    // Create and insert form actions
    const formActions = document.createElement('div');
    formActions.className = 'form-actions';

    const submitButton = document.createElement('input');
    submitButton.type = 'submit';
    submitButton.value = form_mode === "edit" ? "Update" : "Save";
    formActions.appendChild(submitButton);

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = function() { location.href = '/cancel-action'; };
    formActions.appendChild(cancelButton);

    element.appendChild(formActions);
  });

  document.body.addEventListener('submit', function(event) {
    // Check if the submitted form is the one we are interested in
    if (event.target && event.target === element) {
      event.preventDefault();
  
      // Create a FormData object from the form
      const formData = new FormData(element);
      const nestedHashData = {};
  
      // Iterate over the FormData entries
      for (const [key, value] of formData.entries()) {
        // Determine the type of the value
        const isNumericValue = !isNaN(value) && value.trim() !== '';
        nestedHashData[key] = {
          "value": isNumericValue ? parseInt(value, 10) : value,
          "type": isNumericValue ? "integer" : "string"
        };
      }
  
      // Get the action URL from the form's 'action' attribute
      const actionUrl = element.action;
  
      // Convert the nestedHashData to a JSON string
      const jsonBody = JSON.stringify(nestedHashData);
  
      // Perform the fetch request with the JSON body
      fetch(actionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonBody
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        // Handle the response, update the UI as needed
        // Assuming there's a function to update the UI after form submission
        // You will replace the below line with your function call
        console.log('Form submitted successfully. Response:', data);
      })
      .catch(function(error) {
        console.error('Error:', error);
      });
    }
  });
}
