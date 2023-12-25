var PubSub = (function() {
  var events = {};
  var history = {};

  return {
      subscribe: function(eventName, callback) {
          events[eventName] = events[eventName] || [];
          events[eventName].push(callback);

          if (history[eventName]) {
              history[eventName].forEach(event => callback(event));
          }
      },

      publish: function(eventName, data) {
          history[eventName] = history[eventName] || [];
          history[eventName].push(data);

          if (events[eventName]) {
              events[eventName].forEach(callback => callback(data));
          }
      }
  };
})();
