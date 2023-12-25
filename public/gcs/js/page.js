
function page(_, element) {
  var dataId = element.dataset.id;
  
  PubSub.subscribe(EVENTS.TEMPLATE, ({ action, data }) => {
    const { page } = data;
    PubSub.publish(dataId, {
      "page": {
        action: action,
        data: page
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
