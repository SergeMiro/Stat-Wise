import "server-only";
import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";

/**
 * MCP servers, as a list you can grow without touching the chat route.
 *
 * This is the part of the request most able to go wrong: an MCP server is somebody
 * else's code, reached over the network, whose tools are handed to a model that will
 * call them. So three limits are built in rather than left to whoever adds the next
 * server:
 *
 * 1. Only a role with `useMcpServers` gets any of this — see roles.ts.
 * 2. Servers are declared in `AI_MCP_SERVERS`, an env var, not chosen by the client.
 *    A chat message cannot name a server to connect to.
 * 3. A server that fails to connect is skipped and reported, never fatal. One
 *    unreachable server must not take the whole conversation down with it.
 *
 * Clients are closed after the response finishes, which the route does in
 * `onFinish`. Left open, every message would leak a transport.
 */

export type McpServerConfig = {
  /** Shown in the panel and used in logs. */
  name: string;
  /** Streamable HTTP endpoint. */
  url: string;
  /** Optional bearer token, read from the environment with the rest. */
  token?: string;
};

/**
 * Reads the configured servers.
 *
 * Format is JSON so a server can carry a token and a name without inventing a
 * delimiter that a URL might contain:
 *
 *   AI_MCP_SERVERS=[{"name":"docs","url":"https://…/mcp","token":"…"}]
 *
 * A malformed value yields no servers and says so in the console, rather than
 * throwing on every chat request.
 */
export function configuredMcpServers(): McpServerConfig[] {
  const raw = process.env.AI_MCP_SERVERS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) throw new Error("not an array");
    return parsed.flatMap((entry) => {
      if (typeof entry !== "object" || entry === null) return [];
      const { name, url, token } = entry as Record<string, unknown>;
      if (typeof name !== "string" || typeof url !== "string") return [];
      // http(s) only: an MCP server on stdio would be running our own shell.
      if (!/^https?:\/\//.test(url)) return [];
      return [{ name, url, token: typeof token === "string" ? token : undefined }];
    });
  } catch (error) {
    console.warn("AI_MCP_SERVERS is not valid JSON, no MCP servers loaded", error);
    return [];
  }
}

export type McpSession = {
  /** Merged tool set from every server that answered. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- structural tool types
  tools: Record<string, any>;
  /** Names of servers that answered, for the answer's own provenance. */
  connected: string[];
  /** Names that did not, with the reason. Surfaced, never swallowed. */
  failed: { name: string; reason: string }[];
  close: () => Promise<void>;
};

/** Connects to every configured server, tolerating the ones that are down. */
export async function openMcpSession(): Promise<McpSession> {
  const servers = configuredMcpServers();
  const clients: MCPClient[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- structural tool types
  const tools: Record<string, any> = {};
  const connected: string[] = [];
  const failed: { name: string; reason: string }[] = [];

  await Promise.all(
    servers.map(async (server) => {
      try {
        const client = await createMCPClient({
          transport: {
            type: "http",
            url: server.url,
            headers: server.token ? { Authorization: `Bearer ${server.token}` } : undefined,
          },
        });
        clients.push(client);
        const remote = await client.tools();
        /*
          Prefixed with the server name. Two servers each exposing `search` would
          otherwise silently overwrite one another, and the model would call one
          believing it had reached the other.
        */
        for (const [toolName, definition] of Object.entries(remote)) {
          tools[`${server.name}__${toolName}`] = definition;
        }
        connected.push(server.name);
      } catch (error) {
        failed.push({
          name: server.name,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }),
  );

  return {
    tools,
    connected,
    failed,
    close: async () => {
      await Promise.all(clients.map((c) => c.close().catch(() => undefined)));
    },
  };
}
