
var PubSub = {
  subscribers: {},
  state: {},
  lastPublishedState: {},
  pendingRequests: {},

  subscribe: function(eventName, fn) {
    if (typeof eventName === 'undefined') {
      console.error('The event name provided to subscribe is undefined for fn: ', fn);
      return;
    }
  
    if (typeof fn !== 'function') {
      console.error('The callback provided to subscribe for event', eventName, 'is not a function:', fn);
      return;
    }
    
    this.subscribers[eventName] = this.subscribers[eventName] || [];
    this.subscribers[eventName].push(fn);
  
    // If there is already state available for this event, send it to the subscriber
    if (this.state[eventName]) {
      fn(this.state[eventName]);
    }
  },

  requestFullSet: function(eventName, subscriberId, callback) {
    this.subscribers[eventName] = this.subscribers[eventName] || [];

    var subscriberInfo = { id: subscriberId, callback: callback };
    var index = this.subscribers[eventName].findIndex(sub => sub.id === subscriberId);

    if (index === -1) {
      this.subscribers[eventName].push(subscriberInfo);
    } else {
      this.subscribers[eventName][index] = subscriberInfo;
    }

    if (this.state[eventName]) {
      callback({ data: this.state[eventName] });
    } else {
      this.pendingRequests[eventName] = this.pendingRequests[eventName] || [];
      this.pendingRequests[eventName].push({ subscriberId: subscriberId, callback: callback });
    }
  },

  publish: function(eventName, payload) {
    if (typeof eventName === 'undefined') {
      console.error('The event name provided to publish is undefined for payload: ', payload);
      return;
    }

    // Update the state for this event
    this.state[eventName] = this.state[eventName] || {};
    Object.assign(this.state[eventName], payload);

    // Notify all subscribers about the update
    if (this.subscribers[eventName]) {
        this.subscribers[eventName].forEach(function(subscriber, index) {
        // Check if the subscriber is a function or an object with a callback
        if (typeof subscriber === 'function') {
          try {
            subscriber(this.state[eventName]);
          } catch (error) {
            console.error(`[PubSub.publish] Error invoking subscriber at index ${index} for event "${eventName}":`, error);
          }
        } else if (typeof subscriber === 'object' && typeof subscriber.callback === 'function') {
          try {
            // Invoke the callback function if the subscriber is an object
            subscriber.callback(this.state[eventName]);
          } catch (error) {
            console.error(`[PubSub.publish] Error invoking callback for subscriber at index ${index} for event "${eventName}":`, error);
          }
        } else {
          console.error(`[PubSub.publish] Subscriber at index ${index} for event "${eventName}" is not a function or does not have a valid callback:`, subscriber);
          }
      }, this);
    }

    // Execute any pending requests for the event
    if (this.pendingRequests[eventName]) {
      this.executePendingRequests(eventName);
    }
  },

  aggregateChanges: function(multipleEventName, payload) {
    this.state[multipleEventName] = this.state[multipleEventName] || {};
    Object.assign(this.state[multipleEventName], payload.data);
    this.executePendingRequests(multipleEventName);
  },

  executePendingRequests: function(eventName) {
    if (this.pendingRequests[eventName] && this.pendingRequests[eventName].length > 0) {
      this.pendingRequests[eventName].forEach(function(pending) {
        pending.callback({ data: this.state[eventName] });
      }, this);
      this.pendingRequests[eventName] = [];
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
