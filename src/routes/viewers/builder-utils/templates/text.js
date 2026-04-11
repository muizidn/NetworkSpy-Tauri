/**
 * @reserved async function code() 
 * Entry point for block logic. Other functions can be defined at top level.
 * All read* functions must be awaited!
 */

async function code() {
  const headers = await readRequestHeaders();
  return "Content-Type: " + (headers['content-type'] || 'unknown');
}
