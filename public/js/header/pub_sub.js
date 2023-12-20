var PubSub = {
  subscribers: {},
  state: {}, // Stores the current complete state
  lastPublishedState: {}, // Stores the last published state to compare changes

  subscribe: function(eventName, fn) {
    this.subscribers[eventName] = this.subscribers[eventName] || [];
    this.subscribers[eventName].push(fn);

    // Send the current state to the new subscriber
    if (this.state[eventName]) {
      fn(this.state[eventName]);
    }
  },

  requestFullSet: function(eventName, subscriberId, callback) {
    // Ensure we have an array to hold subscribers for the event
    this.subscribers[eventName] = this.subscribers[eventName] || [];
    
    // Create a subscriber object with the provided ID and callback
    var subscriberInfo = { id: subscriberId, callback: callback };
    
    // Check if the subscriber with the given ID is already registered for the event
    var index = this.subscribers[eventName].findIndex(sub => sub.id === subscriberId);
  
    // If the subscriber isn't already in the list, add them
    if (index === -1) {
        this.subscribers[eventName].push(subscriberInfo);
    } else {
        // Update the existing subscriber's callback if it already exists
        this.subscribers[eventName][index] = subscriberInfo;
    }
  
    // Send the current state to the new or updated subscriber if it exists
    if (this.state[eventName]) {
        callback({ data: this.state[eventName] });
    }
  },

  publish: function(eventName, payload) {
    // Check if the payload has an 'action' property
    if (typeof payload === 'object' && payload.hasOwnProperty('action')) {
      // Calculate the delta if action is present
      var delta = this.calculateDelta(this.lastPublishedState[eventName], payload.data);
      // Update the last published state and the current state
      this.lastPublishedState[eventName] = payload.data;
      this.state[eventName] = {...this.state[eventName], ...delta};
      // Wrap the delta with action
      payload = { action: payload.action, data: delta };
    } else {
      // If there is no 'action', the payload is the new state
      this.lastPublishedState[eventName] = payload;
      this.state[eventName] = payload;
      // The payload remains unchanged and can be a non-object (e.g., a string, number, etc.)
    }

    // Publish the payload (which might be a delta with action, or the raw data) to all subscribers
    if (this.subscribers[eventName]) {
      this.subscribers[eventName].forEach(function(fn) {
        fn(payload);
      });
    }
  },

  calculateDelta: function(oldState, newState) {
    var delta = {};
    for (var key in newState) {
      if (!oldState || oldState[key] !== newState[key]) {
        delta[key] = newState[key];
      }
    }
    return delta;
  }
};
