import { readBytesWithBYOBReader } from "./readBytesWithBYOBReader.ts";
import { isEqual } from "https://esm.sh/lodash-es@4.17.21";
/**
 * https://www.rfc-editor.org/rfc/rfc1928
 */
export async function socks5_server_first_username_password(
    conn: Deno.Conn,
    username: string,
    password: string,
): Promise<boolean> {
    const writer = conn.writable.getWriter();
    //Procedure for TCP-based clients
    const VER = (await readBytesWithBYOBReader(conn.readable, 1))[0];
    const NMETHODS = (await readBytesWithBYOBReader(conn.readable, 1))[0];
    const METHODS: Uint8Array = await readBytesWithBYOBReader(
        conn.readable,
        NMETHODS,
    );
    // +----+----------+----------+
    // |VER | NMETHODS | METHODS  |
    // +----+----------+----------+
    // | 1  |    1     | 1 to 255 |
    // +----+----------+----------+

    // +----+--------+
    // |VER | METHOD |
    // +----+--------+
    // | 1  |   1    |
    // +----+--------+

    // o  X'00' NO AUTHENTICATION REQUIRED
    // o  X'01' GSSAPI
    // o  X'02' USERNAME/PASSWORD
    // o  X'03' to X'7F' IANA ASSIGNED
    // o  X'80' to X'FE' RESERVED FOR PRIVATE METHODS
    // o  X'FF' NO ACCEPTABLE METHODS
    if (VER === 5 && [...METHODS].includes(2)) {
        await writer.write(new Uint8Array([5, 2]));
    } else {
        await writer.write(new Uint8Array([5, 255]));

        conn.close();
        return false;
    }
    const negotitation_buffer = new Uint8Array(
        3 + username.length + password.length,
    );
    negotitation_buffer[0] = 1;
    negotitation_buffer[1] = username.length;
    negotitation_buffer.set([...username].map((a) => a.charCodeAt(0)), 2);
    negotitation_buffer[1 + username.length + 1] = password.length;
    negotitation_buffer.set(
        [...password].map((a) => a.charCodeAt(0)),
        1 + username.length + 1 + 1,
    );
    const [a, b] = await readBytesWithBYOBReader(
        conn.readable,
        2,
    );

    if (!(b === negotitation_buffer[1] && a === negotitation_buffer[0])) {
        console.log("用户名和密码验证失败");
        await writer.write(new Uint8Array([0x01, 0x01]));
        conn.close();
        return false;
    }
    const auth_buffer = await readBytesWithBYOBReader(
        conn.readable,
        negotitation_buffer.length - 2,
    );

    if (
        b === negotitation_buffer[1] && a === negotitation_buffer[0] &&
        isEqual(auth_buffer, negotitation_buffer.slice(2))
    ) {
        console.log("用户名和密码验证成功");
        await writer.write(new Uint8Array([0x01, 0x00]));
    } else {
        console.log("用户名和密码验证失败");
        await writer.write(new Uint8Array([0x01, 0x01]));
        conn.close();
        return false;
    }
    writer.releaseLock();
    return true;
    // await proxy_tcp_over_websocket(conn);
}
