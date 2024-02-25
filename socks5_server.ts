import { socks5_server_first } from "./socks5_server_first.ts";
import { socks5_server_second } from "./socks5_server_second.ts";
import config from "./config.json" with { type: "json" };
import { socks5_server_first_username_password } from "./socks5_server_first_username_password.ts";
/**
 * https://www.rfc-editor.org/rfc/rfc1928
 */
export async function socks5_server(conn: Deno.Conn) {
    const { client_username, client_password } = config;

    if (client_username && client_password) {
        const result = await socks5_server_first_username_password(
            conn,
            client_username,
            client_password,
        );
        if (result) await socks5_server_second(conn);
    } else {
        const result = await socks5_server_first(conn);
        if (result) await socks5_server_second(conn);
    }
}
