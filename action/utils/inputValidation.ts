import _ from "lodash";
import * as core from '@actions/core';

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

export interface TaskInputs {
  url: string;
  httpMethod: HttpMethod;
  expectedStatusCode: number;
  useAuthentication?: boolean;
  authenticationMethod?: "basic" | "header";
  expectedPayload?: string;
  requestPayload?: string;
  contentType?: string;
  maxRetries?: number;
  delayBetweenRetries?: number;
  logResponse?: boolean;
  responseOutput?: string;
  responseFilterPath?: string;
}

export function validateTaskInputs(inputs: TaskInputs): void {
  if (_.isEmpty(inputs.url)) {
    throw new Error("URL is required but was not provided.");
  }

  if (!_.inRange(inputs.expectedStatusCode, 100, 600)) {
    throw new Error("Expected status code must be between 100 and 599.");
  }

  if (!_.values(HttpMethod).includes(inputs.httpMethod)) {
    throw new Error(`Invalid HTTP method: ${inputs.httpMethod}`);
  }

  if (
    inputs.useAuthentication &&
    !_.includes(["basic", "header"], inputs.authenticationMethod)
  ) {
    throw new Error(
      `Invalid authentication method: ${inputs.authenticationMethod}`
    );
  }

  if (
    (inputs.maxRetries !== undefined && !_.isInteger(inputs.maxRetries)) ||
    inputs.maxRetries < 0
  ) {
    throw new Error("Max retries must be a non-negative integer.");
  }

  if (
    (inputs.delayBetweenRetries !== undefined &&
      !_.isInteger(inputs.delayBetweenRetries)) ||
    inputs.delayBetweenRetries < 0
  ) {
    throw new Error("Delay between retries must be a non-negative integer.");
  }

  core.debug("Input validation passed.");
}

export function validateEnvironmentVariables(inputs: TaskInputs): void {
  let requiredEnvVars = [];

  if (inputs.useAuthentication) {
    if (inputs.authenticationMethod === "basic") {
      requiredEnvVars.push("SITE_USERNAME", "SITE_PASSWORD");
    } else if (inputs.authenticationMethod === "header") {
      requiredEnvVars.push("SITE_AUTH_TOKEN");
    }
  }

  let missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    missingVars.forEach((varName) => {
      core.error(`Required environment variable ${varName} is not set.`);
    });
    throw new Error(
      "Missing required environment variables based on task configuration."
    );
  }

  core.debug("Necessary environment variable/s validation passed.");
}
