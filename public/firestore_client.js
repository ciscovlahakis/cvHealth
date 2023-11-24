window.firebaseInitialized = new Promise((resolve, reject) => {
  fetch('/firestore_config')
    .then(response => response.json())
    .then(config => {
      firebase.initializeApp(config);
      window.db = firebase.firestore();
      resolve();  // Resolve the Promise now that Firebase is initialized
    })
    .catch(reject);  // If there's an error, reject the Promise
})
.catch((error) => {
  console.error('Error during Firebase initialization:', error);
});
