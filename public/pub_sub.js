// Pub-Sub system for decoupling components
var PubSub = {
  subscribers: {},
  subscribe: function(eventName, fn) {
    this.subscribers[eventName] = this.subscribers[eventName] || [];
    this.subscribers[eventName].push(fn);
  },
  publish: function(eventName, data) {
    if (this.subscribers[eventName]) {
      this.subscribers[eventName].forEach(function(fn) {
        fn(data);
      });
    }
  }
};
