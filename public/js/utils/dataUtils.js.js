
function generateUniqueId() {
  const randomPart = Math.random().toString(36).substring(2, 15); // Generate a random string
  const timestampPart = Date.now().toString(36); // Get a string version of the current timestamp
  return `component-${timestampPart}-${randomPart}`;
}
