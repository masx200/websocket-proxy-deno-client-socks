export async function proxy_tcp_over_websocket(
    conn: Deno.Conn,
    address: string,
    port: number,
    callback: (established: boolean) => Promise<void>
): Promise<void> {
    const ws = new WebSocketStream("ws://localhost:8000", {
        headers: {
            "x-Protocol": "Transmission Control",
            "X-Destination-Address": address,
            "X-Destination-Port": String(port),
        },
    });
    // console.log(ws);
    try {
        const webConn = await ws.opened; //.catch(console.error);
        await callback(true);
        // console.log(conn);
        // console.log(webConn);
        conn.readable.pipeTo(webConn.writable).catch(function (e) {
            try {
                ws.close();
                conn.close();
            } catch (e) {
                console.error(e);
            }

            return console.error(e);
        });
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
