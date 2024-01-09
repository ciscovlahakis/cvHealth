
// Convert to kebab-case
export function convertToKebabCase(str) {
  return splitIntoWords(str).join('-');
}

// Convert to camelCase
export function convertToCamelCase(str) {
  return splitIntoWords(str)
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
}

// Convert to snake_case
export function convertToSnakeCase(str) {
  return splitIntoWords(str).join('_');
}

// Helper function to split string into words
export function splitIntoWords(str) {
  if (!str) str = "";
  return str
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase
      .replace(/[\s_\-\/]+/g, ' ') // Replace underscores, hyphens, slashes, and spaces with a single space
      .toLowerCase()
      .trim()
      .split(' ');
}

export function replaceSubstrings(str, target, delimiter) {
  if (!str || !target || !delimiter) {
    return str; 
  }
  return str.split(target).join(delimiter);
}

export function capitalize(str) {
  if (str.length === 0) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function decapitalize(str) {
  if (!str || typeof str !== 'string' || str.length === 0) {
    return str;
  }
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function convertToSingular(word) {
  return pluralize.singular(word);
}
