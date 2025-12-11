/**
 * Displays the result returned by executeSQL() in a clean terminal format.
 *
 * @param result - The output returned from executeSQL()
 * @returns true on success, or the error object on failure
 */
export function displayResult(result: any): true | unknown {
  console.log("---------------------------------------------------");

  // Error case
  if (result === null) {
    const error = new Error("SQL execution failed. Check logs for details.");
    console.log(error.message);
    return error;
  }

  // Success cases
  if (Array.isArray(result)) {
    if (result.length === 0) {
      console.log("Query executed successfully — no rows returned.");
    } else {
      console.log(`Query executed successfully — ${result.length} rows:\n`);
      console.table(result);
    }
  } else if (typeof result === "object") {
    console.log("Non-SELECT query result:");
    console.log(result);
  } else {
    console.log("Query executed successfully:");
    console.log(result);
  }

  console.log("---------------------------------------------------\n");
  return true;
}
