
function page(_, dataId) {
  on("page", (newValue) => {
    setDoc([dataId, "page"], newValue);
  });

  on("components", (newValue) => {
    setColl([dataId, "components"], newValue);
  });

  on("fragments", (newValue) => {
    setColl([dataId, "fragments"], newValue);
  });
}
