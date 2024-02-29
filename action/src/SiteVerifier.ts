import * as core from "@actions/core";
import { AxiosResponse } from "axios";
import {
  HttpMethod,
  TaskInputs,
  validateTaskInputs,
  validateEnvironmentVariables,
} from "../utils/inputValidation";
import { makeHttpRequest } from "../utils/httpUtils";
import { payloadMatches } from "../utils/validationUtils";
import {
  parseResponseData,
  getResponseType,
} from "../utils/contentTypeHandler"; // Import the new utility functions

async function run(): Promise<void> {
  try {
    parseAndSetEnvironmentVariables();

    const taskInputs: TaskInputs = getTaskInputs();
    core.debug("Task inputs retrieved: " + JSON.stringify(taskInputs));

    // Validate task inputs before proceeding
    try {
      validateTaskInputs(taskInputs);
      validateEnvironmentVariables(taskInputs);
    } catch (error) {
      core.setFailed(error.message);
      return;
    }

    const headers = await configureAuthentication(taskInputs);
    await verifyUrlWithRetries(taskInputs, headers);
  } catch (error) {
    core.error(`Error caught in run function: ${error.message}`);
    core.setFailed(
      `Site verification failed: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

function getTaskInputs(): TaskInputs {
  return {
    url: core.getInput("siteUrl", { required: true }),
    httpMethod: (
      core.getInput("httpMethod", { required: true }) ?? "GET"
    ).toUpperCase() as HttpMethod,
    expectedStatusCode: parseInt(
      core.getInput("expectedStatusCode", { required: true }) ?? "200"
    ),
    useAuthentication:
      core.getInput("useAuthentication", { required: true }) === "true",
    authenticationMethod: core.getInput("authenticationMethod", {
      required: true,
    }) as any as "basic" | "header",
    expectedPayload: core.getInput("expectedPayload", { required: false }),
    requestPayload: core.getInput("requestPayload", { required: false }),
    contentType:
      core.getInput("contentType", { required: false }) ?? "application/json", // todo test this input
    maxRetries: parseInt(
      core.getInput("maxRetries", { required: false }) ?? "3"
    ),
    delayBetweenRetries: parseInt(
      core.getInput("delayBetweenRetries", { required: false }) ?? "5"
    ),
    logResponse: core.getInput("logResponse", { required: false }) === "true",
    responseOutput: core.getInput("responseOutput", { required: false }),
    responseFilterPath: core.getInput("responseFilterPath", {
      required: false,
    }),
  };
}

function parseAndSetEnvironmentVariables(): void {
  const envVarsInput = core.getInput("environmentVariables", {
    required: false,
  });
  if (envVarsInput) {
    const envVarLines = envVarsInput.split("\n");
    envVarLines.forEach((envVarLine) => {
      if (envVarLine.startsWith("SITE_USERNAME=")) {
        const value = envVarLine.substring("SITE_USERNAME=".length);
        process.env.SITE_USERNAME = value.trim();
      } else if (envVarLine.startsWith("SITE_PASSWORD=")) {
        const value = envVarLine.substring("SITE_PASSWORD=".length);
        process.env.SITE_PASSWORD = value.trim();
      } else if (envVarLine.startsWith("SITE_AUTH_TOKEN=")) {
        const value = envVarLine.substring("SITE_AUTH_TOKEN=".length);
        process.env.SITE_AUTH_TOKEN = value.trim();
      }
    });
  }
}

async function configureAuthentication(
  taskInputs: TaskInputs
): Promise<Record<string, string>> {
  if (!taskInputs.useAuthentication) return {};

  const headers: Record<string, string> = {};
  switch (taskInputs.authenticationMethod) {
    case "basic":
      const token = Buffer.from(
        `${process.env.SITE_USERNAME}:${process.env.SITE_PASSWORD}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${token}`;
      break;
    case "header":
      headers["Authorization"] = process.env.SITE_AUTH_TOKEN || "";
      break;
    default:
      throw new Error("Invalid authentication method.");
  }

  return headers;
}

async function verifyUrlWithRetries(
  taskInputs: TaskInputs,
  headers: Record<string, string>
): Promise<void> {
  let success = false;
  let lastStatusCode = NaN;
  for (let attempt = 0; attempt < taskInputs.maxRetries; attempt++) {
    try {
      const response: AxiosResponse = await makeHttpRequest({
        method: taskInputs.httpMethod,
        url: taskInputs.url,
        headers: {
          ...headers,
          "Content-Type": taskInputs.contentType,
        },
        data: taskInputs.requestPayload,
        responseType: getResponseType(taskInputs.contentType),
        logResponse: taskInputs.logResponse,
      });

      const responseData = parseResponseData(
        response,
        taskInputs.responseFilterPath
      );

      lastStatusCode = response.status;
      const responseContent =
        typeof responseData === "object"
          ? JSON.stringify(responseData)
          : responseData;
      if (taskInputs.responseOutput) {
        core.setOutput(taskInputs.responseOutput, responseContent);
      }

      if (taskInputs.logResponse) {
        console.log(`Response: ${responseContent}`);
      }

      if (response.status !== taskInputs.expectedStatusCode) {
        core.warning(
          `Attempt ${attempt + 1}: Unexpected status code: ${response.status}`
        );
        continue;
      }

      if (taskInputs.expectedPayload) {
        const isPayloadMatch = payloadMatches(
          responseData,
          taskInputs.expectedPayload,
          taskInputs.logResponse
        );

        if (!isPayloadMatch) {
          core.warning(`Attempt ${attempt + 1}: Unexpected payload.`);
          continue;
        }
      }

      success = true;
      console.log(`Site verification succeeded for URL ${taskInputs.url}.`);
      core.setOutput("result", "Site verification succeeded.");
      return;
    } catch (error) {
      core.warning(
        `Attempt ${attempt + 1} failed: ${
          error instanceof Error ? error.message : error
        }`
      );
    }

    await new Promise((resolve) =>
      setTimeout(resolve, taskInputs.delayBetweenRetries * 1000)
    );
  }

  if (!success) {
    core.setFailed(`Site verification failed for URL ${taskInputs.url}.`);
  }
}

if (require.main === module) {
  run().then(() => core.debug("SiteVerifier task execution completed."));
}

export { run, configureAuthentication, verifyUrlWithRetries };
