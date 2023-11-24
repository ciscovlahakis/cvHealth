console.log("Fetching Firestore config...");
fetch('/firestore_config')
  .then(response => {
    console.log("Response object: ", response);
    console.log("Response status: " + response.status);
    return response.text();  // Get the response text instead of JSON
  })
  .then(text => {
    console.log("Response text: ", text);  // Log the raw response text
    return JSON.parse(text);  // Try to parse the text as JSON
  })
  .then(config => {
    console.log("Config received: ", config);
    firebase.initializeApp(config);
    window.db = firebase.firestore();
    console.log("Firebase initialized. window.db:", window.db);
    
    // Call the main function of your other scripts
    if (window.main) {
      console.log("Calling main function...");
      window.main();
    }
  })
  .catch(error => console.error('Error:', error));
