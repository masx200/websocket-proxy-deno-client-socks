import config from "./config.json" with { type: "json" };
/**
 * 获取websocket代理URL
 * @returns {string} websocket代理URL
 */
export function get_websocket_proxy_url(): string {
    return config["websocket_proxy_url"] ?? "ws://localhost:8000";
}
