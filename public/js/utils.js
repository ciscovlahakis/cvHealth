
// Convert to kebab-case
function convertToKebabCase(str) {
  return splitIntoWords(str).join('-');
}

// Convert to camelCase
function convertToCamelCase(str) {
  return splitIntoWords(str)
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
}

// Convert to snake_case
function convertToSnakeCase(str) {
  return splitIntoWords(str).join('_');
}

// Helper function to split string into words
function splitIntoWords(str) {
  if (!str) str = "";
  return str
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase
      .replace(/[\s_-]+/g, ' ') // Replace underscores, hyphens, and spaces with a single space
      .toLowerCase()
      .trim()
      .split(' ');
}

function capitalize(str) {
  if (str.length === 0) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function assignDefined(target, ...sources) {
  sources.forEach(source => {
      Object.keys(source).forEach(key => {
          const val = source[key];
          if (val !== undefined) {
              target[key] = val;
          }
      });
  });
  return target;
}

function generateUniqueId() {
  const randomPart = Math.random().toString(36).substring(2, 15); // Generate a random string
  const timestampPart = Date.now().toString(36); // Get a string version of the current timestamp
  return `component-${timestampPart}-${randomPart}`;
}
