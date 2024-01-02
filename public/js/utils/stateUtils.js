
function createDeepReactiveState(initialState = {}) {
  const listeners = new Map();

  const notifyListeners = (property, value) => {
    let propertyParts = property.split(".");
    propertyParts.forEach((_, idx) => {
      let propToNotify = propertyParts.slice(0, idx + 1).join(".");
      (listeners.get(propToNotify) || []).forEach(({ listener }) => {
        listener(getNestedValue(propToNotify));
      });
    });
  };

  const applyProxy = (target) => {
    return new Proxy(target, {
      get(target, property, receiver) {
        return Reflect.get(target, property, receiver);
      },
      set(target, property, value) {
        const segments = getPath(property);
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
    const path = getPath(property, true);
    if (!listeners.has(path)) {
      listeners.set(path, []);
    }
    listeners.get(path).push({ listener });

    // Optionally, call listener immediately with current value
    const currentValue = getNestedValue(path);
    if (currentValue !== undefined) {
      listener(currentValue);
    }
  };

  return {
    _state: applyProxy(initialState),
    on,
  };
}

// CRUD operations for documents
function setDoc(ref, data) {
  const path = getPath(ref, true);
  if (typeof data !== "object") {
    throw new Error(`New value for ${path} is not an object.`);
  }
  state[path] = data;
}

function getCollection(ref) {
  const path = getPath(ref, true);
  const value = getNestedValue(path);
  if (!Array.isArray(value)) {
    throw new Error(`Target at ${path} is not a collection.`);
  }
  return value;
}

function getDoc(ref) {
  const path = getPath(ref, true);
  const value = getNestedValue(path);
  if (typeof value !== "object") {
    if (!value) return {};
    throw new Error(`Target at ${path} is not an object.`);
  }
  return value;
}

function upsertDoc(ref, data) {
  const path = getPath(ref, true);
  const doc = getDoc(path);
  state[path] = { ...doc, ...data };
}

// CRUD operations for collections
function setCollection(ref, data) {
  const path = getPath(ref, true);
  if (!Array.isArray(data)) {
    throw new Error(`New value for ${path} is not an array.`);
  }
  state[path] = data;
}

function addDoc(ref, data) {
  const path = getPath(ref, true);
  state[path] ||= [];
  if (!Array.isArray(state[path])) {
    throw new Error(`Target at ${path} is not a collection.`);
  }
  state[path].push(data);
}

function getCollection(ref) {
  const path = getPath(ref, true);
  const collection = getNestedValue(path);
  if (!Array.isArray(collection)) {
    if (!collection) return [];
    throw new Error(`Target at ${path} is not a collection.`);
  }
  return collection;
}

function updateCollectionDoc(ref, docId, data) {
  const path = getPath(ref, true);
  const collection = getCollection(path);
  const docIndex = collection.findIndex((doc) => doc.id === docId);
  if (docIndex === -1) {
    throw new Error(
      `Document with id ${docId} not found in collection ${path}.`
    );
  }
  collection[docIndex] = { ...collection[docIndex], ...data };
}

function removeCollectionDoc(ref, docId) {
  const path = getPath(ref, true);
  const collection = getCollection(path);
  const docIndex = collection.findIndex((doc) => doc.id === docId);
  if (docIndex === -1) {
    throw new Error(
      `Document with id ${docId} not found in collection ${path}.`
    );
  }
  collection.splice(docIndex, 1);
}

function removeKey(ref) {
  const path = getPath(ref, true);
  delete state[path];
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

function getNestedValue(ref) {
  const segments = getPath(ref);
  return segments.reduce(
    (current, key) => (current ? current[key] : undefined),
    state
  );
}

function getPath(ref, asString = false) {
  if (typeof ref === "string") {
    return asString ? ref : ref.split(".");
  }
  if (Array.isArray(ref)) {
    return asString ? ref.join(".") : ref;
  }
  throw new Error("Invalid ref type. Ref must be a string or an array.");
}
