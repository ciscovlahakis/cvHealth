
function page(_, dataId) {

  const { template, components, fragmentsByHash } = state;

  state[dataId].page = template?.page;
  state[dataId].components = components;
  state[dataId].fragmentsByHash = fragmentsByHash;
}
