/**
 * @reserved async function code() 
 * Entry point for block logic. Other functions can be defined at top level.
 * All read* functions must be awaited!
 */

async function code() {
  // Fetch data to be used in HTML
  const headers = await readRequestHeaders();
  return {
    host: headers['host'] || 'Unknown',
    timestamp: new Date().toLocaleTimeString(),
    chartColors: ['#3b82f6', '#10b981', '#f59e0b']
  };
}
