import type { RequestHandler, Response } from "express";
import type { OutgoingHttpHeader, OutgoingHttpHeaders } from "node:http";

/**
 * Send actual HTTP/1.1 chunks on MCP and discovery routes, including auth errors.
 * Some MCP intermediaries replace Content-Length with Transfer-Encoding without
 * framing the body. Explicit chunking avoids malformed responses on that path.
 */
export const chunkMcpResponses: RequestHandler = (req, res, next) => {
  const writeHead = res.writeHead.bind(res);
  res.writeHead = function (
    statusCode: number,
    reasonOrHeaders?: string | OutgoingHttpHeaders | OutgoingHttpHeader[],
    headers?: OutgoingHttpHeaders | OutgoingHttpHeader[]
  ) {
    const reason = typeof reasonOrHeaders === "string" ? reasonOrHeaders : undefined;
    const supplied = reason === undefined ? reasonOrHeaders : headers;
    let outgoing = supplied as OutgoingHttpHeaders | OutgoingHttpHeader[] | undefined;
    if (req.httpVersionMajor === 1 && req.httpVersionMinor === 1 &&
        req.method !== "HEAD" && statusCode >= 200 && statusCode !== 204 && statusCode !== 304) {
      const isFraming = (name: string) => /^(content-length|transfer-encoding)$/i.test(name);
      if (Array.isArray(outgoing)) {
        outgoing = outgoing.filter((_value, i, values) => !isFraming(String(values[i - (i % 2)])));
      } else if (outgoing) {
        outgoing = Object.fromEntries(Object.entries(outgoing).filter(([name]) => !isFraming(name)));
      }
      res.removeHeader("Content-Length");
      res.setHeader("Transfer-Encoding", "chunked");
    }
    return reason === undefined
      ? writeHead(statusCode, outgoing)
      : writeHead(statusCode, reason, outgoing);
  } as Response["writeHead"];
  next();
};
