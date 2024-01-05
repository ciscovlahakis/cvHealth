
function page(_, dataId) {
  on("page", (newValue) => {
    setDoc([dataId, "page"], newValue);
  }, dataId);

  on("components", (newValue) => {
    setColl([dataId, "components"], newValue);
  }, dataId);

  on("fragments", (newValue) => {
    setColl([dataId, "fragments"], newValue);
  }, dataId);
}
