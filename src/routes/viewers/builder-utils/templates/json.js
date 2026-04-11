/**
 * @reserved async function code() 
 * Entry point for block logic. Other functions can be defined at top level.
 * All read* functions must be awaited!
 */

async function code() {
  const body = await readRequestBody();
  try {
    return JSON.parse(body);
  } catch (e) {
    return { error: "Not a valid JSON" };
  }
}
