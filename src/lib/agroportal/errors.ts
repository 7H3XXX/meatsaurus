/**
 * Raised whenever the AgroPortal upstream call fails — non-2xx response,
 * timeout, network failure, or a response that doesn't match the shape we
 * depend on. Route handlers catch this and translate it into an HTTP
 * response without leaking upstream details (or the API key) to the client.
 */
export class AgroPortalError extends Error {
  readonly code: "UPSTREAM_ERROR" | "TIMEOUT" | "NETWORK_ERROR" | "PARSE_ERROR" | "NOT_FOUND";
  readonly status?: number;

  constructor(
    code: AgroPortalError["code"],
    message: string,
    options?: { status?: number; cause?: unknown }
  ) {
    super(message, { cause: options?.cause });
    this.name = "AgroPortalError";
    this.code = code;
    this.status = options?.status;
  }
}
