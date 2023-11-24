require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const firestore = admin.firestore();

const algoliasearch = require("algoliasearch");
const ALGOLIA_ID = process.env["ALGOLIA_APPLICATION_ID"];
const ALGOLIA_ADMIN_KEY = process.env["ALGOLIA_ADMIN_API_KEY"];
const client = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);

firestore
    .collection("collections")
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        const collectionName = doc.id;

        exports[`index${collectionName}OnCreate`] = functions.firestore
            .document(`${collectionName}/{documentId}`)
            .onCreate((snap, context) =>
              indexDocument(collectionName, snap, context),
            );

        exports[`index${collectionName}OnUpdate`] = functions.firestore
            .document(`${collectionName}/{documentId}`)
            .onUpdate((change, context) =>
              indexDocument(collectionName, change.after, context),
            );

        exports[`unindex${collectionName}OnDelete`] = functions.firestore
            .document(`${collectionName}/{documentId}`)
            .onDelete((snap, context) =>
              unindexDocument(collectionName, context));
      });
    })
    .catch((err) => {
      console.log("Error getting documents", err);
    });

/**
 * Indexes a document in Algolia.
 *
 * @param {string} collectionName - The name of the collection.
 * @param {Object} snap - The document snapshot.
 * @param {Object} context - The context in which the function is being called.
 * @return {Promise} Promise representing the result of the save operation.
 */
function indexDocument(collectionName, snap, context) {
  const data = snap.data();
  data.objectID = context.params.documentId;

  const index = client.initIndex(collectionName);
  return index.saveObject(data);
}

/**
 * Deletes a document from Algolia index.
 *
 * @param {string} collectionName - The name of the collection.
 * @param {Object} context - The context in which the function is being called.
 * @return {Promise} Promise representing the result of the delete operation.
 */
function unindexDocument(collectionName, context) {
  const index = client.initIndex(collectionName);
  return index.deleteObject(context.params.documentId);
}
