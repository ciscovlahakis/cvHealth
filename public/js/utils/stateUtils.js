
function createDeepReactiveState(initialState = {}) {
  const listeners = new Map();

  const notifyListeners = (property, value) => {
    let propertyParts = property.split(".");
    propertyParts.forEach((_, idx) => {
      let propToNotify = propertyParts.slice(0, idx + 1).join(".");
      (listeners.get(propToNotify) || []).forEach(({ listener }) => {
        listener(getNestedValue(state, propToNotify));
      });
    });
  };

  const applyProxy = (target) => {
    return new Proxy(target, {
      get(target, property, receiver) {
        return Reflect.get(target, property, receiver);
      },
      set(target, property, value) {
        const segments = property.split(".");
        let current = target;

        // Navigate to the correct target for the property
        for (let i = 0; i < segments.length - 1; i++) {
          const segment = segments[i];

          if (!(segment in current)) {
            current[segment] = {}; // create a new object if the path does not exist
          }

          current = current[segment];
        }

        // Set the property on the target
        const finalKey = segments[segments.length - 1];
        current[finalKey] = value;

        // Notify listeners
        notifyListeners(property, value);

        return true;
      },
    });
  };

  const on = (property, listener) => {
    if (!listeners.has(property)) {
      listeners.set(property, []);
    }
    listeners.get(property).push({ listener });

    // Optionally, call listener immediately with current value
    const currentValue = getNestedValue(state, property);
    if (currentValue !== undefined) {
      listener(currentValue);
    }
  };

  return {
    _state: applyProxy(initialState),
    on,
  };
}

function getNestedValue(obj, path) {
  return path
    .split(".")
    .reduce((current, key) => (current ? current[key] : undefined), obj);
}

// CRUD operations for documents
function setDoc(ref, data) {
  if (typeof data !== "object") {
    throw new Error(`New value for ${ref} is not an object.`);
  }
  state[ref] = data;
}

function getCollection(ref) {
  const value = getNestedValue(state, ref);
  if (!Array.isArray(value)) {
    throw new Error(`Target at ${ref} is not a collection.`);
  }
  return value;
}

function getDoc(ref, upsert = false) {
  const value = getNestedValue(state, ref);
  if (typeof value !== "object") {
    if (!value) {
        return upsert ? {} : undefined;
    } else {
      throw new Error(`Target at ${ref} is not an object.`);
    }
  }
  return value;
}

function upsertDoc(ref, data) {
  const doc = getDoc(ref, true);
  state[ref] = { ...doc, ...data };
}

// CRUD operations for collections
function setCollection(ref, data) {
  if (!Array.isArray(data)) {
    throw new Error(`New value for ${ref} is not an array.`);
  }
  state[ref] = data;
}

function addDoc(ref, data) {
  state[ref] ||= [];
  if (!Array.isArray(state[ref])) {
    throw new Error(`Target at ${ref} is not a collection.`);
  }
  state[ref].push(data);
}

function getCollection(ref) {
  const collection = getNestedValue(state, ref);
  if (!Array.isArray(collection)) {
    throw new Error(`Target at ${ref} is not a collection.`);
  }
  return collection;
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

function removeKey(ref) {
  delete state[ref];
}

function inspectProxy(proxy) {
  const inspectedObject = {};
  for (const key in proxy) {
    if (proxy.hasOwnProperty(key)) {
      inspectedObject[key] = proxy[key];
    }
  }
  return JSON.parse(JSON.stringify(inspectedObject));
}
