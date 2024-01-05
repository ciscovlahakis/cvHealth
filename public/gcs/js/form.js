
function form(element, dataId, dataParentId) {

  ["collection", "fields", "formMode", "editItem"].forEach((x) => {
    on([dataParentId, x], () => renderForm(getDoc(dataParentId)), dataId);
  });

  function renderForm(props) {
    const { collection, fields, formMode, editItem } = props;

    // Clear previous fields (if any)
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }

    element.classList.add('form-container');

    // Create and insert form contents
    const header = document.createElement('h2');
    header.textContent = formMode === "update" ? "Edit Item" : "Add Item";
    element.appendChild(header);

    // Generate form fields
    (fields || []).forEach((field) => {
      if (field.editable) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const label = document.createElement('label');
        label.htmlFor = field.name;
        label.textContent = capitalize(field.name) || '';
        formGroup.appendChild(label);

        const input = document.createElement('input');
        input.type = 'text'; // Assuming the input type is text
        input.id = field.name;
        input.name = field.name;
        input.value = editItem ? editItem[field.name] || '' : '';
        input.required = formMode === 'create';
        formGroup.appendChild(input);

        element.appendChild(formGroup);
      }
    });

    // Create and insert form actions
    const formActions = document.createElement('div');
    formActions.className = 'form-actions';

    const submitButton = document.createElement('input');
    submitButton.type = 'submit';
    submitButton.value = formMode === "update" ? "Update" : "Save";
    submitButton.onclick = function(event) {

      event.preventDefault();
    
      const formData = new FormData(element);
      const nestedHashData = {};
    
      for (const [key, value] of formData.entries()) {
        const isNumericValue = !isNaN(value) && value.trim() !== '';
        nestedHashData[key] = {
          "value": isNumericValue ? parseInt(value, 10) : value,
          "type": isNumericValue ? "integer" : "string"
        };
      }
    
      let method = 'POST';
      if (editItem) {
        const isCompletelyChanged = Object.keys(editItem).every(key => 
          nestedHashData[key] && editItem[key] != nestedHashData[key].value
        );
        const isPartiallyChanged = Object.keys(editItem).some(key => 
          nestedHashData[key] && editItem[key] != nestedHashData[key].value
        );
        if (isCompletelyChanged) {
          method = 'PUT';
        } else if (isPartiallyChanged) {
          method = 'PATCH';
        }
      }

      var actionUrl = '/';
      actionUrl += method === 'POST' ? 'create' : 'update';
      actionUrl += '/' + collection;
      actionUrl += method !== 'POST' ? '/' + editItem.id : '';
    
      const jsonBody = JSON.stringify(nestedHashData);

      fetch(actionUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonBody
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok: ' + response.statusText);
        }
        if (response.headers.get("content-type")?.includes("application/json")) {
          return response.json();
        }
        throw new Error('Response not in JSON format');
      })
      .then(data => {
        console.log('Form submitted successfully. Response:', data);
        hideFormAndRouteToUrlWithoutHash()
      })
      .catch(error => {
        console.error('Error:', error);
      });
    };

    formActions.appendChild(submitButton);

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = hideFormAndRouteToUrlWithoutHash;
    formActions.appendChild(cancelButton);

    element.appendChild(formActions);
  }

  function hideFormAndRouteToUrlWithoutHash() {
    // Remove the hash from the URL without reloading the page using history API
    history.pushState(null, document.title, window.location.pathname + window.location.search);
        
    // Hide the nearest ancestor modal overlay that contains the form
    const fragmentElement = element.closest('div[data-id]:not([data-id="' + element.getAttribute('data-id') + '"])');
    if (fragmentElement) {
      fragmentElement.style.display = 'none';
    }
  }
}
