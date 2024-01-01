
function page(_, dataId) {
  on('template', newValue => {
    setDoc([dataId, "page"], newValue?.page);
  });

  on('components', newValue => {
    setCollection([dataId, "components"], newValue);
  });

  on('fragments', newValue => {
    setCollection([dataId, "fragments"], newValue);
  });

  on('fragmentsByHash', newValue => {
    console.log(newValue)
    setDoc([dataId, "fragmentsByHash"], newValue);
  });
}
