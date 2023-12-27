
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

function setupFirestoreListener(collectionName, searchTerm) {
  window.firebaseInitialized.then(function() {
    var collectionRef = window.db.collection(collectionName);

    collectionRef.onSnapshot(function(snapshot) {
      var firestoreResults = [];
      snapshot.forEach(function(doc) {
        firestoreResults.push(
          {
            ...doc.data(),
            id: doc.id,
          }
        );
      });
      PubSub.publish(EVENTS.SEARCH_RESULTS, { searchTerm: searchTerm, results: firestoreResults });
    }, function(error) {
      console.error("Error listening to Firestore changes:", error);
    });
  }).catch(function(error) {
    console.error("Error initializing Firestore listener:", error);
  });
}
