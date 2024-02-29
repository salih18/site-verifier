import * as cheerio from "cheerio";
import { AxiosResponse } from "axios";
import { get } from "lodash";

function containsKeywords(text: string, keywords: string): boolean {
  const keywordList = keywords
    .split(",")
    .map((keyword) => keyword.trim().toLowerCase());

  return keywordList.every((keyword) => text.toLowerCase().includes(keyword));
}

function extractHtmlContent(data: string, path: string): string | null {
  const $ = cheerio.load(data);
  return $(path).html() || null;
}

function extractJsonContent(data: any, path: string): any {
  return get(data, path, null);
}

function parseResponseData(
  response: AxiosResponse,
  responseFilterPath?: string
): any {
  const contentType = response.headers["content-type"];
  const { data } = response;

  if (!responseFilterPath) return data;

  if (contentType?.includes("application/json")) {
    return extractJsonContent(data, responseFilterPath);
  }

  if (
    contentType?.includes("text/html") ||
    contentType?.includes("application/xml") ||
    contentType?.includes("text/xml")
  ) {
    return extractHtmlContent(data, responseFilterPath);
  }

  if (contentType?.includes("text/plain")) {
    return containsKeywords(data, responseFilterPath);
  }

  return data;
}

function getResponseType(
  contentType: string
): "arraybuffer" | "blob" | "document" | "json" | "text" | "stream" {
  if (contentType.includes("application/json")) {
    return "json";
  }
  if (
    contentType.includes("application/xml") ||
    contentType.includes("text/xml") ||
    contentType.includes("text/html")
  ) {
    return "document";
  }
  return "text";
}

export { parseResponseData, getResponseType };
