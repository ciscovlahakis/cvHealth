window.onload = function () {

  function createDropdownHTML(index) {
    return `
      <div class="dropdown" id="dropdown${index}" style="display: none;">
        <button class="button">Select:</button>
        <div class="dropdown-content"></div>
        <input type="hidden" id="recurrence${index}" name="recurrence${index}">
      </div>
    `;
  }

  var dropdownsContainer = document.getElementById('dropdowns-container');
  var dropdownsCount = 4;
  for (let i = 1; i <= dropdownsCount; i++) {
    dropdownsContainer.innerHTML += createDropdownHTML(i);
  }  

  var dropdownDependencies = {
    'START': ['Every', 'For'],
    'Every': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Day', 'Week', 'Month', 'Year'],
    'For': ['1', '2', '3'],
    'Monday': ['For', 'Until'],
    'Tuesday': ['For', 'Until'],
    'Wednesday': ['For', 'Until'],
    'Thursday': ['For', 'Until'],
    'Friday': ['For', 'Until'],
    'Saturday': ['For', 'Until'],
    'Sunday': ['For', 'Until'],
    'Day': ['For', 'Until'],
    'Week': ['For', 'Until'],
    'Month': ['For', 'Until'],
    'Year': ['For', 'Until'],
    'For': ['1', '2', '3'],
    'Until': ['Date'],
    '1': [], // Add a corresponding array for '1'
    '2': [], // Add a corresponding array for '2'
    '3': [], // Add a corresponding array for '3'
    'Date': [] // Add a corresponding array for 'Date'
  };

  // Initialize the dropdowns
  var dropdowns = [];
  for (let i = 1; i <= dropdownsCount; i++) {
    dropdowns.push(createDropdown(`dropdown${i}`, ".button", ".dropdown-content", `recurrence${i}`));
  }

  // Set the initial options for the first dropdown
  updateDropdownOptions(dropdowns[0], dropdownDependencies['START']);

  var isRecurrent = document.getElementById("is-recurrent");

  function updateDropdownOptions(dropdown, options) {

    dropdown.content.innerHTML = '';

    // Add "Select:" as an option
    if (options[0] !== "Select:") {
      options.unshift("Select:");
    }

    for (let i = 0; i < options.length; i++) {
      let p = document.createElement('p');
      p.textContent = options[i];
      p.setAttribute('data-value', options[i]);

      p.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var previousValue = dropdown.input.value;
        dropdown.button.textContent = p.textContent;
        dropdown.input.value = p.getAttribute('data-value');
        dropdown.content.style.display = 'none';
        if (dropdown.input.value !== previousValue) {
          var currentDropdown = dropdown.dropdown.nextElementSibling;
          while (currentDropdown) {
            var currentButton = currentDropdown.querySelector(".button");
            var currentInput = currentDropdown.querySelector('input[type="hidden"]');
            currentDropdown.style.display = 'none';
            currentButton.textContent = 'Select:';
            currentInput.value = '';
            currentDropdown = currentDropdown.nextElementSibling;
          }
        }
        if (dropdown.dropdown.nextElementSibling) {
          var nextDropdown = dropdown.dropdown.nextElementSibling;
          var nextDropdownContent = nextDropdown.querySelector(".dropdown-content");
          var nextOptions = dropdownDependencies[dropdown.input.value];
          if (nextOptions) {
            nextDropdown.style.display = 'inline-block';
            updateDropdownOptions({
              dropdown: nextDropdown,
              button: nextDropdown.querySelector(".button"),
              content: nextDropdownContent,
              input: nextDropdown.querySelector('input[type="hidden"]')
            }, nextOptions);
          }
        }
      };

      dropdown.content.appendChild(p);
    }

    if (dropdown.dropdown.nextElementSibling) {
      var currentDropdown = dropdown.dropdown.nextElementSibling;
      while (currentDropdown) {
        var currentButton = currentDropdown.querySelector(".button");
        var currentInput = currentDropdown.querySelector('input[type="hidden"]');
        currentDropdown.style.display = 'none';
        currentButton.textContent = 'Select:';
        currentInput.value = '';
        currentDropdown = currentDropdown.nextElementSibling;
      }
    }
  }

  function createDropdown(dropdownId, buttonId, contentId, inputId, nextDropdownId) {
    var dropdown = document.getElementById(dropdownId);
    var button = dropdown.querySelector(buttonId);
    var content = dropdown.querySelector(contentId);
    var input = document.getElementById(inputId);

    button.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      content.style.display = content.style.display === 'block' ? 'none' : 'block';
    };

    // add this block of code
    var initialOptions = Array.from(content.querySelectorAll('p')).map(function (p) {
      return p.getAttribute('data-value');
    });

    updateDropdownOptions({
      dropdown: dropdown,
      button: button,
      content: content,
      input: input
    }, initialOptions);

    return {
      dropdown: dropdown,
      button: button,
      content: content,
      input: input
    };
  }

  // If checkbox is unchecked, hide all dropdowns and reset their selections
  isRecurrent.onchange = function () {
    if (this.checked) {
      dropdowns[0].dropdown.style.display = "inline-block";
    } else {
      dropdowns.forEach(function (dropdown) {
        dropdown.dropdown.style.display = "none";
        dropdown.button.textContent = "Select:";
        dropdown.input.value = "";
      });
    }
  }
    
  // Call the onchange function to set initial visibility of dropdowns
  isRecurrent.onchange();
}
