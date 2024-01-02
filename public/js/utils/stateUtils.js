
function createDeepReactiveState(initialState = {}) {
  const listeners = new Map();
  const transformedListeners = new Map();

  function transformCollection(coll, key) {
    const transformed = {};
    coll.forEach((item) => {
      if (key in item) {
        transformed[item[key]] = item;
      }
    });
    return transformed;
  }

  function notifyListeners(property, isTransformed = false) {
    let propertyParts = property.split(".");
    propertyParts.forEach((_, idx) => {
      let propToNotify = propertyParts.slice(0, idx + 1).join(".");
      let relevantListeners = isTransformed ? transformedListeners : listeners;
      (relevantListeners.get(propToNotify) || []).forEach(({ listener }) => {
        listener(getNestedValue(propToNotify));
      });
    });
  }

  const applyProxy = (target) => {
    return new Proxy(target, {
      get(target, property, receiver) {
        return Reflect.get(target, property, receiver);
      },
      set(target, property, value) {
        const isTransformedProperty = property.includes("By");

        if (!isTransformedProperty) {
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

          if (Array.isArray(value)) {
            transformedListeners.forEach((_, key) => {
              if (key.startsWith(`${property}By`)) {
                const transformKey = key.split("By")[1];
                const transformedKey = `${property}By${transformKey}`;
                current[`${finalKey}By${transformKey}`] = transformCollection(
                  value,
                  decapitalize(transformKey)
                ); // Use original transformKey for transformation
                notifyListeners(transformedKey, true); // Notify listeners of the transformed data
              }
            });
          }
          notifyListeners(getPath(property, true));
        } else {
          Reflect.set(target, property, value);
        }
        return true;
      },
    });
  };

  function on(property, listener, transformKey = null) {
    const path = getPath(property, true);
    const relevantPath = transformKey
      ? `${path}By${capitalize(transformKey)}`
      : path;
    const relevantListeners = transformKey ? transformedListeners : listeners;
    if (!relevantListeners.has(relevantPath)) {
      relevantListeners.set(relevantPath, []);
    }
    relevantListeners.get(relevantPath).push({ listener });

    let currentValue = getNestedValue(relevantPath);
    if (transformKey && currentValue === undefined) {
      // If the transformed data does not exist yet, create and store it
      const originalValue = getNestedValue(path);
      if (Array.isArray(originalValue)) {
        currentValue = transformCollection(originalValue, transformKey);
      }
    }
    if (currentValue !== undefined) {
      listener(currentValue);
    }
  }

  return {
    state: applyProxy(initialState),
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

function getColl(ref) {
  const path = getPath(ref, true);
  const value = getNestedValue(path);
  if (!Array.isArray(value)) {
    throw new Error(`Target at ${path} is not a collection.`);
  }
  return value;
}

function upsertDoc(ref, data) {
  const path = getPath(ref, true);
  const doc = getDoc(path);
  state[path] = { ...doc, ...data };
}

// CRUD operations for collections
function setColl(ref, data) {
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
  state[path] = [...state[path], data];
}

function updateCollDoc(ref, docId, data) {
  const path = getPath(ref, true);
  const coll = getColl(path);
  const docIndex = coll.findIndex((doc) => doc.id === docId);
  if (docIndex === -1) {
    throw new Error(
      `Document with id ${docId} not found in collection ${path}.`
    );
  }
  coll[docIndex] = { ...coll[docIndex], ...data };
}

function removeCollDoc(ref, docId) {
  const path = getPath(ref, true);
  const coll = getColl(path);
  const docIndex = coll.findIndex((doc) => doc.id === docId);
  if (docIndex === -1) {
    throw new Error(
      `Document with id ${docId} not found in collection ${path}.`
    );
  }
  coll.splice(docIndex, 1);
}

function removeKey(ref) {
  const path = getPath(ref, true);
  delete state[path];
}

function getColl(...pathSegments) {
  return getCollOrDoc(pathSegments, true);
}

function getDoc(...pathSegments) {
  return getCollOrDoc(pathSegments, false);
}

function getCollOrDoc(pathSegments, isColl) {
  // If the first argument is an array, use it as the path; otherwise, use all arguments as the path
  const path = Array.isArray(pathSegments[0]) ? pathSegments[0] : pathSegments;
  const pathStr = getPath(path, true);
  const value = getNestedValue(pathStr);

  if (isColl) {
    if (!Array.isArray(value)) {
      if (!value) return [];
      throw new Error(`Target at ${pathStr} is not a collection.`);
    }
  } else {
    if (typeof value !== "object") {
      if (!value) return {};
      throw new Error(`Target at ${pathStr} is not an object.`);
    }
  }
  return value;
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

function inspectProxy(proxy) {
  const inspectedObject = {};
  for (const key in proxy) {
    if (proxy.hasOwnProperty(key)) {
      inspectedObject[key] = proxy[key];
    }
  }
  return JSON.parse(JSON.stringify(inspectedObject));
}
