
function createDeepReactiveState(initialState = {}) {
  const listeners = new Map();
  const pendingListeners = new Map();
  let notifyScheduled = false;
  let notifyQueue = new Map();

  const scheduleNotification = (property, value) => {
    notifyQueue.set(property, value);
    if (!notifyScheduled) {
      notifyScheduled = true;
      Promise.resolve().then(flushNotifications);
    }
  };

  const flushNotifications = () => {
    notifyQueue.forEach((value, property) => {
      (listeners.get(property) || []).forEach((listener) => listener(value));
    });
    notifyQueue.clear();
    notifyScheduled = false;
  };

  const listen = (property, listener) => {
    if (!listeners.has(property)) {
      listeners.set(property, []);
    }
    listeners.get(property).push(listener);
  };

  const applyProxy = (target, propertyPath = "") => {
    return new Proxy(target, {
      get(target, property, receiver) {
        const nextPath = propertyPath
          ? `${propertyPath}.${property}`
          : property;
        return target[property] === undefined
          ? undefined
          : Reflect.get(target, property, receiver);
      },
      set(target, property, value, receiver) {
        const fullPath = propertyPath
          ? `${propertyPath}.${property}`
          : property;
        const result = Reflect.set(target, property, value, receiver);

        if (pendingListeners.has(fullPath)) {
          pendingListeners.get(fullPath).forEach((listener) => {
            listen(fullPath, listener);
          });
          pendingListeners.delete(fullPath);
        }

        scheduleNotification(fullPath, value);
        return result;
      },
    });
  };

  const on = (property, listener) => {
    const { current, lastKey } = navigateToRef(property);
    if (current[lastKey] === undefined) {
      if (!pendingListeners.has(property)) {
        pendingListeners.set(property, []);
      }
      pendingListeners.get(property).push(listener);
    } else {
      listen(property, listener);
      // Notify the listener with the current state
      listener(current[lastKey]);
    }
  };

  return {
    state: applyProxy(initialState),
    on,
  };
}

// Helper function to navigate to the reference in the state
function navigateToRef(ref) {
    const keys = typeof ref === "string" ? ref.split(".") : ref;
    let current = state;
    for (let i = 0; i < keys.length - 1; i++) {
        if (current[keys[i]] === undefined) {
            current[keys[i]] = {}; // Initialize intermediate segments as empty objects
        }
        current = current[keys[i]];
    }
    return { current, lastKey: keys[keys.length - 1] };
}

// CRUD operations for documents
function setDoc(ref, data) {
  const { current, lastKey } = navigateToRef(ref);
  current[lastKey] = data;
}

function getDoc(ref) {
  const { current, lastKey } = navigateToRef(ref);
  return current[lastKey];
}

function updateDoc(ref, data) {
  const { current, lastKey } = navigateToRef(ref);
  if (typeof current[lastKey] !== "object" || Array.isArray(current[lastKey])) {
    throw new Error(`Target at ${ref} is not a suitable object for update.`);
  }
  current[lastKey] = { ...current[lastKey], ...data };
}

function deleteDoc(ref) {
  const { current, lastKey } = navigateToRef(ref);
  delete current[lastKey];
}

// CRUD operations for collections
function setCollection(ref, data) {
  const { current, lastKey } = navigateToRef(ref);

  if (!Array.isArray(data)) {
    throw new Error(`New value for ${ref} is not an array.`);
  }

  current[lastKey] = data;
}

function addDoc(ref, data) {
  const { current, lastKey } = navigateToRef(ref);
  if (current[lastKey] === undefined) {
    current[lastKey] = [];
  }
  if (!Array.isArray(current[lastKey])) {
    throw new Error(`Target at ${ref} is not a collection.`);
  }
  current[lastKey].push(data);
}

function getCollection(ref) {
  const { current, lastKey } = navigateToRef(ref);
  if (!Array.isArray(current[lastKey])) {
    throw new Error(`Target at ${ref} is not a collection.`);
  }
  return current[lastKey];
}

function updateCollectionDoc(ref, docId, data) {
  const collection = getCollection(ref);
  const docIndex = collection.findIndex((doc) => doc.id === docId);
  if (docIndex === -1) {
    throw new Error(
      `Document with id ${docId} not found in collection ${ref}.`
    );
  }
  collection[docIndex] = { ...collection[docIndex], ...data };
}

function removeCollectionDoc(ref, docId) {
  const collection = getCollection(ref);
  const docIndex = collection.findIndex((doc) => doc.id === docId);
  if (docIndex === -1) {
    throw new Error(
      `Document with id ${docId} not found in collection ${ref}.`
    );
  }
  collection.splice(docIndex, 1);
}

function inspectProxy(proxy) {
  const inspectedObject = {};
  for (const key in proxy) {
    if (proxy.hasOwnProperty(key)) {
      inspectedObject[key] = proxy[key];
    }
  }
  return inspectedObject;
}
