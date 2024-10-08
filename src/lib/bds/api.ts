import type { ServerRpc } from './routes'

/**
 * Sends packet message to the core nodejs process running BDS. Used mostly for console/chat logging purposes, when data
 * must be sent but the response is not needed.
 *
 * @param type - Packet type
 * @param packet - Packet content
 */
export function sendPacketToStdout<T extends keyof ServerRpc.StdoutPackets>(
  type: T,
  packet: ServerRpc.StdoutPackets[T],
) {
  console.log(`[Packet] [${type}] ${JSON.stringify(packet)}`)
}
