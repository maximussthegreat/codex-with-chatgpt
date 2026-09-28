# Private MCP transport

Run the same nine read-only workspace tools over stdin/stdout:

```sh
node bin/c2c.js stdio --workspace /absolute/path/to/workspace
```

This command opens no TCP listener, starts no public tunnel, and creates no
OAuth or bridge runtime state. Stdout is reserved for MCP messages. The local
process is trusted to read the selected workspace, subject to the existing
sensitive-file exclusions. Only attach it to a trusted local client or an
authorized private tunnel.

For OpenAI Secure MCP Tunnel, configure the tunnel client's MCP command to run
the absolute Node executable and the absolute `bin/c2c.js` path with `stdio`
and `--workspace`. Follow the current official tunnel-client instructions:
https://developers.openai.com/api/docs/guides/secure-mcp-tunnels

The tunnel requires an authorized tunnel identity and runtime API credential.
The stdio command does not provision either, alter a ChatGPT connector, or
claim that ChatGPT is connected. Do not substitute a public Cloudflare tunnel
when public exposure is prohibited.

The HTTP bridge remains available through `c2c start --workspace ...` without
`--tunnel`. MCP HTTP/1.1 responses use actual chunk framing, including early
authentication, discovery and JSON-parser errors, to tolerate intermediaries that alter
Content-Length on the `/mcp` route. Bearer authentication remains required.
