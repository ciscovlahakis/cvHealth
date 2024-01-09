
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

function setupFirestoreListener(collectionName, filterArray, callback) {
  window.firebaseInitialized.then(function() {
    let query = window.db.collection(collectionName);

    // Apply the filter if provided
    if (filterArray && filterArray.length === 3) {
      const [field, operator, value] = filterArray;
      query = query.where(field, operator, value);
    }

    query.onSnapshot(function(snapshot) {
      const data = [];
      snapshot.forEach(function(doc) {
        data.push({
          ...doc.data(),
          id: doc.id,
        });
      });
      // Execute the callback with the fetched data
      if (callback && typeof callback === 'function') {
        callback(data);
      }
    }, function(error) {
      console.error("Error listening to Firestore changes:", error);
      // Handle the error case in the callback, if provided
      if (callback && typeof callback === 'function') {
        callback([], error);
      }
    });
  }).catch(function(error) {
    console.error("Error initializing Firestore listener:", error);
  });
}
