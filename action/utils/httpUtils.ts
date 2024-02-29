import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import * as core from "@actions/core";

export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  logResponse: boolean;
}

export async function makeHttpRequest(
  config: ExtendedAxiosRequestConfig
): Promise<AxiosResponse<any>> {
  try {
    core.debug(
      `Making HTTP request to ${config.url} with method ${config.method}`
    );
    config.timeout = config.timeout || 10000;
    const response = await axios(config);
    const logMessage = config.logResponse
      ? `Successfully completed HTTP request: Method=${config.method}, URL=${
          config.url
        }, Status=${response.status}, Response=${JSON.stringify(response.data)}`
      : `Successfully completed HTTP request: Method=${config.method}, URL=${config.url}, Status=${response.status}`;
    core.debug(logMessage);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response
        ? `Status: ${error.response.status}, Data: ${JSON.stringify(
            error.response.data
          )}`
        : error.message;
      core.error(`HTTP request failed: ${message}`);
      throw new Error(message);
    } else {
      core.error(`Unexpected error making HTTP request: ${error}`);
      throw error;
    }
  }
}
