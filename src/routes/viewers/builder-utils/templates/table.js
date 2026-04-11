/**
 * @reserved async function code() 
 * Entry point for block logic. Other functions can be defined at top level.
 * All read* functions must be awaited!
 */

async function code() {
  // Return an array of objects for table view
  return [
    { key: "Method", value: "GET" },
    { key: "Status", value: 200 }
  ];
}
