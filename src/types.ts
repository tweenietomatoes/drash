import { Resource } from "../mod.ts";

/**
 * The allowed types for an HTTP method on a resource.
 */
export type THttpMethod =
  | "CONNECT"
  | "DELETE"
  | "GET"
  | "HEAD"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PUT"
  | "TRACE";

export type TResourcesAndPatterns = Map<number, {
  resource: Resource;
  patterns: URLPattern[];
}>;