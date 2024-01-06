
function createDeepReactiveState(initialState = {}) {
  const listeners = new Map();
  const transformedListeners = new Map();
  const componentCollectionParentMap = new Map();

  function findBasePath(path, componentId) {
    if (!path || !componentId) return;

    const pathArray = getPath(path);
    const pathString = getPath(path, true);

    if (pathArray.length === 1) {
      return pathArray; // Direct state property
    }

    const parentComponentId = componentCollectionParentMap
      .get(componentId)
      ?.get(pathString);

    if (parentComponentId) {
      const newPath = pathArray.slice(1);
      return findBasePath(newPath, parentComponentId);
    }

    return pathArray; // Original path if no parent is found
  }

  function transformColl(coll, key) {
    const transformed = {};
    coll.forEach((item) => {
      if (key in item) {
        transformed[item[key]] = item;
      }
    });
    return transformed;
  }

  function notifyListeners(path, isTransformed = false) {
    let pathParts = path.split(".");
    pathParts.forEach((_, idx) => {
      let propToNotify = pathParts.slice(0, idx + 1).join(".");
      let relevantListeners = isTransformed ? transformedListeners : listeners;
      (relevantListeners.get(propToNotify) || []).forEach(({ listener }) => {
        listener(getNestedValue(propToNotify));
      });
    });
  }

  const applyProxy = (target) => {
    return new Proxy(target, {
      get(target, path, receiver) {
        return Reflect.get(target, path, receiver);
      },
      set(target, path, value) {
        const isTransformedPath = path.includes("By");
        if (isTransformedPath) {
          Reflect.set(target, path, value);
          return true;
        }

        const pathArray = getPath(path);
        let current = target;

        for (let i = 0; i < pathArray.length - 1; i++) {
          const pathSegment = pathArray[i];
          if (!(pathSegment in current)) {
            current[pathSegment] = {};
          }
          current = current[pathSegment];
        }

        const finalKey = pathArray[pathArray.length - 1];
        current[finalKey] = value;

        if (Array.isArray(value)) {
          transformedListeners.forEach((listeners, key) => {
            if (key.startsWith(`${path}By`)) {
              const transformKey = key.split("By")[1];
              const transformedValue = transformColl(
                value,
                decapitalize(transformKey)
              );
              const transformedProperty = `${path}By${transformKey}`;
              state[transformedProperty] = transformedValue;

              listeners.forEach(({ listener }) => {
                listener(transformedValue);
              });
            }
          });
        }

        const pathString = getPath(path, true);
        notifyListeners(pathString);

        return true;
      },
    });
  };

  function on(path, listener, componentId, transformKey = null) {
    if (!path || (typeof path !== 'string' && !Array.isArray(path))) {
      throw new Error(`${path} must be a string or array.`);
    }
    if (!listener || typeof listener !== 'function') {
      throw new Error(`${listener} must be a function.`);
    }
    if (!componentId || typeof componentId !== 'string') {
      throw new Error(`${componentId} must be a string.`);
    }

    const pathArray = getPath(path);
    let relevantPath = getPath(path, true);

    // The first element is considered the parent component ID for nested paths
    let parentComponentId;
    if (pathArray && pathArray.length && pathArray.length > 1) {
      parentComponentId = pathArray[0];
    }

    if (!componentCollectionParentMap.has(componentId)) {
      componentCollectionParentMap.set(componentId, new Map());
    }

    componentCollectionParentMap
      .get(componentId)
      .set(relevantPath, parentComponentId);

    let currentValue = getNestedValue(relevantPath);

    if (transformKey) {
      const basePath = findBasePath(pathArray, componentId);
      const basePathString = getPath(basePath, true);
      relevantPath = `${basePathString}By${capitalize(transformKey)}`;
      if (currentValue === undefined) {
        const originalValue = getNestedValue(basePathString);
        if (Array.isArray(originalValue)) {
          currentValue = transformColl(originalValue, transformKey);
          state[relevantPath] = currentValue; // Store transformed data
        }
      }
    }

    const relevantListeners = transformKey ? transformedListeners : listeners;
    if (!relevantListeners.has(relevantPath)) {
      relevantListeners.set(relevantPath, []);
    }
    relevantListeners.get(relevantPath).push({ listener, componentId });

    listener(currentValue);
  }

  return {
    state: applyProxy(initialState),
    on,
  };
}

// CRUD operations for documents
function setDoc(ref, data) {
  const path = getPath(ref, true);
  if (typeof data !== "object" && data !== undefined) {
    throw new Error(`New value for ${path} is not an object: ${data}`);
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
  if (!Array.isArray(data) && data !== undefined) {
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
