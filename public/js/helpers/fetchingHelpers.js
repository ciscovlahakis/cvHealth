import { upsertDoc } from '../utils/stateUtils.js';

export async function fetchAndUpdateState(url) {
  const sanitizedUrl = sanitizeUrlSlashes(url);
  try {
    const response = await fetch(sanitizedUrl);
    const responseText = await response.text();
    if (!response.ok) {
      console.error("HTTP error response:", responseText);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    try {
      const data = JSON.parse(responseText);
      return upsertDoc(data.path, data);
    } catch (jsonError) {
      console.error("Failed to parse JSON:", jsonError);
      throw new TypeError("The response is not valid JSON.");
    }
  } catch (error) {
    console.error(`Error in fetchAndUpdateState: ${error.message} with url: ${sanitizedUrl}`);
    throw error;
  }
}

function sanitizeUrlSlashes(url) {
  if (url.includes('%2F')) {
    return url.replace(/%2F/g, 'SLASH');
  }
  return url;
}
