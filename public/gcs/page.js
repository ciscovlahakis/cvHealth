
function page() {
  var element = document.querySelector('#page');
  var dataId = element.dataset.id;
  
  PubSub.subscribe(EVENTS.PAGE, ({ action, data }) => {
    PubSub.publish(dataId, {
      "page": {
        action: action,
        data: data
      }
    });
  });
  
  PubSub.subscribe(EVENTS.COMPONENT, ({ action, data }) => {
    PubSub.publish(dataId, {
      "component": {
        action: action,
        data: data
      }
    });
  });
  
  PubSub.subscribe(EVENTS.FRAGMENT, ({ action, data }) => {
    PubSub.publish(dataId, {
      "fragment": {
        action: action,
        data: data
      }
    });
  });
}
