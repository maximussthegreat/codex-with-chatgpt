import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";
import { Workspace } from "../workspace/manager.js";
import { nullLogger } from "../logger/index.js";

/** Trusted local child process: no listener, public tunnel or OAuth state. */
export async function startStdio(workspaceRoot: string) {
  const server = createMcpServer({ workspace: new Workspace(workspaceRoot), logger: nullLogger });
  await server.connect(new StdioServerTransport());
  return server;
}
