import * as core from "@actions/core";
import isEqual from "lodash/isEqual";
import differenceWith from "lodash/differenceWith";
import isEmpty from "lodash/isEmpty";

export function payloadMatches(
  actualPayload: any,
  expectedPayload: string,
  logResponse: boolean
): boolean {
  let expected: any;

  try {
    expected = JSON.parse(expectedPayload);
  } catch (error) {
    // Parsing failed
    expected = expectedPayload;
  }

  // Convert actualPayload to a comparable format if necessary
  if (
    typeof expected === "number" &&
    typeof actualPayload === "string" &&
    !isNaN(parseFloat(actualPayload))
  ) {
    actualPayload = parseFloat(actualPayload);
  } else if (
    typeof expected === "string" &&
    typeof actualPayload !== "string"
  ) {
    // If expected is a string but actual is not, convert actual to string for comparison
    actualPayload = JSON.stringify(actualPayload);
  }

  if (isEqual(actualPayload, expected)) {
    core.debug("Payloads match successfully.");
    return true;
  } else {
    core.warning(`Expected and Received payload does not match!`);

    if (logResponse) {
      const diff = differenceWith([actualPayload], [expected], isEqual);
      if (!isEmpty(diff)) {
        core.warning(`Differences found: ${JSON.stringify(diff)}`);
      } else {
        core.warning(
          `No differences found. Issue may be in data types or structure.`
        );
      }
    }
    return false;
  }
}
