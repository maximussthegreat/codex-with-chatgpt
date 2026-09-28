import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport, getDefaultEnvironment } from "@modelcontextprotocol/sdk/client/stdio.js";
import { makeTmpDir, cleanup, write } from "./helpers.js";

describe("private stdio CLI", () => {
  it("serves the workspace without creating HTTP, tunnel or credential state", async () => {
    const root = makeTmpDir("stdio-workspace");
    const stateDir = makeTmpDir("stdio-state");
    write(root, "hello.txt", "private workspace\n");
    const client = new Client({ name: "stdio-test", version: "1.0.0" });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx/esm", path.resolve("src/cli/index.ts"), "stdio", "--workspace", root],
      env: { ...getDefaultEnvironment(), C2C_STATE_DIR: stateDir },
      stderr: "pipe",
    });
    try {
      await client.connect(transport);
      expect((await client.listTools()).tools).toHaveLength(9);
      const info = await client.callTool({ name: "workspace_info", arguments: {} });
      expect(info.isError).not.toBe(true);
      expect(info.structuredContent).toMatchObject({ workspaceName: path.basename(root) });
      const file = await client.callTool({ name: "read_file", arguments: { path: "hello.txt" } });
      expect(file.isError).not.toBe(true);
      expect(JSON.stringify(file.structuredContent)).toContain("private workspace");
      expect(fs.readdirSync(stateDir)).toEqual([]);
    } finally {
      await client.close();
      await transport.close();
      cleanup(root);
      cleanup(stateDir);
    }
  });
});
