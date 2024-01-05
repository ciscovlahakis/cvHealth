
document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('upload');
  
  form.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission
    
    var formData = new FormData(form);
    var currentHash = window.location.hash; // Capture the current hash
    
    fetch(form.action, {
      method: 'POST',
      body: formData
    }).then(function(response) {
      // Check the response status
      if (!response.ok) {
        throw new Error('Network response was not OK');
      }
      // Perform the redirect using the hash
      window.location.hash = currentHash;
      window.location.reload(true); // Force reload without cache
    }).catch(function(error) {
      console.error('There has been a problem with your fetch operation:', error);
    });
  });
});
