
function form(dataParentId, element) {

  // Set fields


  PubSub.subscribe(dataParentId, function(data) {
    var collection = data?.collection;
    var fields = data?.fields;
    var action_url = data?.form_mode === "new" ? "/create/" : "/edit/";
    action_url += collection;
  });
}
