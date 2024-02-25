import { get_websocket_proxy_url } from "./get_websocket_proxy_url.ts";
import config from "./config.json" with { type: "json" };
/**
 * 通过WebSocket代理TCP连接
 * @param conn Deno.Conn对象，表示原始TCP连接
 * @param address 目标地址
 * @param port 目标端口
 * @param callback 回调函数，用于处理连接是否成功建立
 * @returns Promise<void>
 */
export async function proxy_tcp_over_websocket(
    conn: Deno.Conn,
    address: string,
    port: number,
    callback: (established: boolean) => Promise<void>,
): Promise<void> {
    const headers: HeadersInit = {
        "x-Protocol": "CONNECT",
        "X-Destination-Address": address,
        "X-Destination-Port": String(port),
    };
    //添加http基本身份认证

    if (config["server_username"] != null && config["server_password"]) {
        headers["Authorization"] = "Basic " + btoa(
            config["server_username"] + ":" +
                config["server_password"],
        );
    }
    // 创建WebSocketStream对象
    const ws = new WebSocketStream(get_websocket_proxy_url(), {
        headers: headers,
    });
    // 打开WebSocket连接
    try {
        const webConn = await ws.opened; //.catch(console.error);
        await callback(true);
        // 将原始TCP连接的可读流管道连接到WebSocket连接的可写流
        conn.readable.pipeTo(webConn.writable).catch(function (e) {
            try {
                ws.close();
                conn.close();
            } catch (e) {
                console.error(e);
            }
            return console.error(e);
        });
        // 将WebSocket连接的可读流管道连接到原始TCP连接的可写流
        webConn.readable.pipeTo(conn.writable).catch(function (e) {
            try {
                ws.close();
                conn.close();
            } catch (e) {
                console.error(e);
            }
            return console.error(e);
        });
    } catch (error) {
        console.error(error);
        try {
            ws.close();
            conn.close();
            await ws.closed;
        } catch (e) {
            console.error(e);
        }
        await callback(false);
    }
}
