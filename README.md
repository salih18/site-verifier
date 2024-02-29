# Site Verifier for Github Actions

<img src="./icon.png" alt="SiteVerifier Icon" style="width: 200px; height: 200px;">

## Introduction

### Overview

SiteVerifier is a GitHub Action designed to automate the verification of web services and APIs, ensuring their availability and correctness throughout your development and CI/CD workflows. Seamlessly integrate it into your GitHub Actions for proactive quality assurance.

### Features

- **Versatile HTTP Methods:** Supports GET, POST, PUT, DELETE, PATCH.
- **Comprehensive Verification:** Validates URLs, status codes, and response payloads.
- **Flexible Request Configuration:** Custom headers, payloads, and authentication methods.
- **Advanced Response Processing:** Filters and validates JSON, HTML, XML, and text responses.
- **Resilient Retry Mechanism:** Automates retries for transient failures.
- **Customizable Content Handling:** Manages various content types for requests and responses.
- **Detailed Debugging Support:** Optionally logs response data for in-depth analysis.
- **Seamless Workflow Integration:** Utilizes output variables for subsequent workflow steps.
- **Secure Credential Management:** Safeguards sensitive data using GitHub secrets.

These capabilities empower developers and operations teams with a reliable tool to ensure the performance and reliability of their web services.

## Getting Started

### Installation

To use the SiteVerifier Action in your GitHub workflows, simply reference it in your workflow YAML file. No manual installation steps are required.

### Quick Start

Here’s a minimal setup to start verifying a site:

```yaml
name: Site Verification Workflow

on:
  push:

jobs:
  verify_site:
    runs-on: ubuntu-latest
    steps:
      - name: Verify Site
        uses: salih18/site-verifier@v0
        with:
          siteUrl: 'https://example.com'
          expectedStatusCode: 200
          httpMethod: 'GET'
```

This configuration sends a GET request to `https://example.com`, expecting a `200 OK` response. It provides a foundational demonstration of the action's core functionality, ideal for initial integration into your workflow.

## Configuration

Below is a comprehensive example demonstrating the SiteVerifier Action's configuration with various input parameters:

```yaml
name: Site Verification Workflow

on:
  push:

jobs:
  verify_site:
    runs-on: ubuntu-latest
    steps:
      - name: Verify Site
        uses: salih18/site-verifier@v0
        with:
          siteUrl: 'https://example.com/api' # The fully qualified URL for the HTTP request.
          expectedStatusCode: 200 # The expected HTTP status code for a successful response.
          useAuthentication: true # Indicates if the request requires authentication.
          authenticationMethod: 'basic' # Authentication method: 'basic' or 'header'.
          requestPayload: '{"status": "ok"}' # JSON string needed for POST, PUT, or PATCH methods.
          httpMethod: 'GET' # The HTTP method for the request.
          contentType: 'application/json' # Content-Type header for the request.
          logResponse: true # Option to log the response body for debugging.
          responseOutput: 'responseContent' # Variable to store response body for further processing.
          responseFilterPath: 'data.result' # Path to filter specific data from the response.
          expectedPayload: '{"status": "ok"}' # Expected response payload for validation.
          maxRetries: 3 # Number of retries on failure.
          delayBetweenRetries: 5 # Delay in seconds between retries.
        env:
          SITE_USERNAME: $(${{ secrets.Site_Username }}) # Environment variable for Basic Auth username.
          SITE_PASSWORD: $(${{ secrets.Site_Username }}) # Environment variable for Basic Auth password.
          SITE_AUTH_TOKEN: $(${{ secrets.Site_Auth_Token }}) # Environment variable for pre-encoded authorization header.
```

### Task Parameters

- **`siteUrl`**: Required. The target URL for verification. Must be fully qualified, including the scheme (http/https).
- **`expectedStatusCode`**: Optional. The expected HTTP status code from the request. Defaults to `200`.
- **`useAuthentication`**: Optional. Indicates if authentication is required for the request.
- **`authenticationMethod`**: Optional. Specifies the authentication type (`basic` or `header`). Defaults to `'basic'`. Only considered if `useAuthentication` is `true`.
- **`requestPayload`**: Optional. JSON payload for POST, PUT, or PATCH requests.
- **`httpMethod`**: Optional. The HTTP method to use for the request. Defaults to `'GET'`.
- **`contentType`**: Optional. The Content-Type header for the request. Defaults to `'application/json'`. Supported `contentType` values: `application/json`, `text/html`, `application/xml`, `text/xml`, `text/plain`.
- **`logResponse`**: Optional. Enable this option to log the response content in the build or release logs. **Caution**: Be mindful when enabling this feature, especially in production environments, as the response may contain sensitive information that could be exposed in log files. Review the content being logged and consider the security implications before enabling logging of response content.
- **`responseOutput`**: Optional. An optional task variable as an output to store the response body.
- **`responseFilterPath`**: Optional. JSON path expression to filter specific response data. **JSON Responses**: The `responseFilterPath` is used as a JSONPath expression, allowing precise selection within a JSON structure for validating specific parts of the response. **HTML/XML Responses**: With the cheerio.js library, `responseFilterPath` employs CSS-like selectors to pinpoint elements in HTML or XML, aiding in the extraction and validation of data from complex documents. **Plain Text Responses**: For plain text, `responseFilterPath` specifies a substring to find within the text. Existence of this substring switches a boolean value (true if found, false if not), which is then evaluated against `expectedPayload` for validation success.
- **`expectedPayload`**: Optional. The expected response payload for validation purposes. This setting is crucial for ensuring that the response from the tested endpoint matches predefined expectations, facilitating comprehensive testing across different response types. **For JSON and HTML/XML**: It expects the payload to match specified values or structures extracted using `responseFilterPath`. This could be a specific JSON object, an array, or text extracted from HTML/XML elements. Otherwise it returns null. **For Plain Text**: When used in conjunction with `responseFilterPath`, it verifies if the plain text search yields a true (presence) or false (absence) outcome, aligning this result with the expected boolean value specified in `expectedPayload`.
- **`maxRetries`**: Optional. Controls the number of retry attempts upon failure. Defaults to `3`.
- **`delayBetweenRetries`**: Optional. The delay between retries, in seconds. Defaults to `5`.
- **`environmentVariables`**: Optional. Additional environment variables for authentication. Use the format `KEY=VALUE` for each variable, separated by new lines. Accepted keys: `SITE_USERNAME`, `SITE_PASSWORD`, `SITE_AUTH_TOKEN`. For yaml definitions there is also another way to pass env variables, see examples.

## Examples

The examples section provides various scenarios, ranging from basic site verification without authentication to more complex cases involving POST requests, payload verification, and response filtering. Each example is presented with YAML configuration snippets, demonstrating the use of different parameters and configurations to meet specific verification needs.

### Verifying HTTP Status Code

```yaml
- name: Verify HTTP Status Code
  uses: salih18/site-verifier@v0
  with:
    siteUrl: "https://httpbin.org/status/200"
    expectedStatusCode: 200
    httpMethod: "GET"
```

### Basic Authentication Check

```yaml
- name: Basic Authentication Check
  uses: salih18/site-verifier@v0
  with:
    siteUrl: "https://httpbin.org/basic-auth/user/passwd"
    expectedStatusCode: 200
    httpMethod: "GET"
    useAuthentication: "true"
    authenticationMethod: "basic"
  env:
    SITE_USERNAME: ${{ secrets.Site_Username }}
    SITE_PASSWORD: ${{ secrets.Site_Password }}
```

### Header Authentication Check

This example demonstrates the use of header authentication for site verification.

```yaml
- name: Header Authentication Check
  uses: salih18/site-verifier@v0
  with:
    siteUrl: "https://httpbin.org/bearer"
    expectedStatusCode: 200
    httpMethod: "GET"
    useAuthentication: "true"
    authenticationMethod: "header"
  env:
    SITE_AUTH_TOKEN: ${{ secrets.SITE_AUTH_TOKEN }}
```

### POST Request Example

Sending a POST request with a JSON payload.

```yaml
- name: Payload Verification with POST Request
  uses: salih18/site-verifier@v0
  with:
    siteUrl: "https://httpbin.org/post"
    expectedStatusCode: 200
    httpMethod: "POST"
    requestPayload: '{"key": "value"}'
```

### POST Request with Payload and Verification

Performing a POST request with payload verification against an expected response.

```yaml
- name: POST Request with Body and Payload Verification
  uses: salih18/site-verifier@v0
  with:
    siteUrl: "https://jsonplaceholder.typicode.com/posts"
    expectedStatusCode: 201
    httpMethod: "POST"
    requestPayload: '{"title": "foo", "body": "bar", "userId": 1}'
    expectedPayload: '{"title": "foo", "body": "bar", "userId": 1, "id": 101}'
```

### Response Filtering

Using response filtering to validate specific parts of the response.

```yaml
- name: PUT Request with Response Filtering (Non-nested)
  uses: salih18/site-verifier@v0
  with:
    siteUrl: "https://jsonplaceholder.typicode.com/posts/1"
    expectedStatusCode: 200
    httpMethod: "PUT"
    maxRetries: 1
    requestPayload: '{"title": "foo", "body": "bar", "userId": 2}'
    expectedPayload: "2"
    logResponse: true
    responseOutput: "my_response"
    responseFilterPath: "userId"
```

### Deeply Nested Response Filtering

Extracting and verifying deeply nested values from a JSON response.

```yaml
- name: GET Request with Deeply Nested Response Filtering (City)
  uses: salih18/site-verifier@v0
  with:
    siteUrl: "https://jsonplaceholder.typicode.com/users/1"
    expectedStatusCode: 200
    httpMethod: "GET"
    expectedPayload: "Gwenborough"
    responseFilterPath: "address.city"
```

### XML Response Filtering and Validation

Verifying and filtering data from an XML response.

```yaml
- name: Response in XML
  uses: salih18/site-verifier@v0
  with:
    siteUrl: "https://httpbin.org/xml"
    expectedStatusCode: 200
    httpMethod: "GET"
    contentType: "application/xml"
    responseFilterPath: "slide > title"
    expectedPayload: "Wake up to WonderWidgets!"
```

### TEXT Response Filtering and Validation

Filtering and validating plain text responses.

```yaml
- name: Response in Text Plain
  uses: salih18/site-verifier@v0
  with:
    siteUrl: "https://httpbin.org/deny"
    expectedStatusCode: 200
    httpMethod: "GET"
    contentType: "text/plain"
    responseFilterPath: "YOU SHOULDN'T BE HERE"
    expectedPayload: true
```

### HTML Response Filtering and Validation

Filtering and validating elements from an HTML response.

```yaml
- name: Response in HTML
  uses: salih18/site-verifier@v0
  with:
    siteUrl: "https://httpbin.org/html"
    expectedStatusCode: 200
    httpMethod: "GET"
    contentType: "text/html"
    responseFilterPath: "h1"
    expectedPayload: "Herman Melville - Moby-Dick"
```

#### Using Response Output Variable

```yaml
name: Verify Authentication and Process Response

on: [push]

jobs:
  verify_and_process:
    runs-on: ubuntu-latest
    steps:
      - name: Verify Site Authentication Status
        id: verify_auth
        uses: salih18/site-verifier@v0
        with:
          siteUrl: "https://httpbin.org/basic-auth/user/passwd"
          expectedStatusCode: 200
          httpMethod: "GET"
          useAuthentication: "true"
          authenticationMethod: "basic"
          responseOutput: "isAuthenticated" # Stores the authenticated status in 'isAuthenticated'.
        env:
          SITE_USERNAME: user
          SITE_PASSWORD: passwd

      - name: Authenticated User Script
        if: steps.verify_auth.outputs.isAuthenticated == 'true'
        run: echo "User is authenticated. Running authenticated script..."

      - name: Unauthenticated User Script
        if: steps.verify_auth.outputs.isAuthenticated != 'true'
        run: echo "User is not authenticated. Running unauthenticated script..."
```

In this GitHub Actions workflow:

- The `siteUrl` points to a resource requiring basic authentication.
- The `responseOutput` is used to capture whether the response indicates successful authentication. (Note: The actual implementation of capturing the `authenticated` status depends on the action's capability to parse and output this specific piece of information. This example assumes the action can do so based on provided inputs.)
- The `env` section securely passes credentials using GitHub secrets.
- Conditional steps (`if: steps.verify_auth.outputs.isAuthenticated == 'true'`) then determine which script to run based on the authentication status captured in the `isAuthenticated` output variable from the `verify_auth` step.
