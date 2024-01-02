
function page(_, dataId) {
  on('page', newValue => {
    setDoc([dataId, "page"], newValue);
  });

  on('components', newValue => {
    setCollection([dataId, "components"], newValue);
  });

  on('fragments', newValue => {
    setCollection([dataId, "fragments"], newValue);
  });
}
