
function createReactiveState(initialState, dependencyMap) {
    const reactiveState = new Proxy(initialState, {
        set(target, property, value) {
            const oldValue = target[property];
            target[property] = value;

            if (dependencyMap[property] && oldValue !== value) {
                const depFunctions = dependencyMap[property](target);
                if (Array.isArray(depFunctions)) {
                    depFunctions.forEach(func => func && func());
                } else if (typeof depFunctions === 'function') {
                    depFunctions();
                }
            }
            return true;
        }
    });

    // Initial calls to dependency functions
    for (let property in dependencyMap) {
        if (dependencyMap[property]) {
            const depFunctions = dependencyMap[property](reactiveState);
            if (Array.isArray(depFunctions)) {
                depFunctions.forEach(func => func && func());
            } else if (typeof depFunctions === 'function') {
                depFunctions();
            }
        }
    }

    return reactiveState;
}
