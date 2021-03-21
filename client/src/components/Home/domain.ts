import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import * as t from 'io-ts'
import { NonEmptyString } from 'io-ts-types'

const From = t.literal('UI')

const AuthorizationMessage = t.type(
  {
    type: t.literal('Authorization'),
    from: From,
    accessToken: NonEmptyString
  },
  'AuthorizationMessage'
)
export type AuthorizationMessage = t.TypeOf<typeof AuthorizationMessage>

const HandshakingMessage = t.type(
  {
    type: t.literal('Handshaking'),
    from: t.literal('UI')
  },
  'HandshakingMessage'
)
type HandshakingMessage = t.TypeOf<typeof HandshakingMessage>

export const Message = t.union(
  [AuthorizationMessage, HandshakingMessage],
  'Message'
)
export type Message = t.TypeOf<typeof Message>

const AuthorizedResponse = t.type(
  {
    type: t.literal('Authorized')
  },
  'AuthorizedResponse'
)
type AuthorizedResponse = t.TypeOf<typeof AuthorizedResponse>

const RefusalReason = t.keyof(
  {
    ConnectionBusy: true,
    Forbidden: true
  },
  'RefusalReason'
)
export type RefusalReason = t.TypeOf<typeof RefusalReason>

export function foldRefusalReason<T>(
  whenConnectionBusy: IO<T>,
  whenForbidden: IO<T>
): Reader<RefusalReason, T> {
  return reason => {
    switch (reason) {
      case 'ConnectionBusy':
        return whenConnectionBusy()
      case 'Forbidden':
        return whenForbidden()
    }
  }
}

const RefusedResponse = t.type(
  {
    type: t.literal('Refused'),
    reason: RefusalReason,
    message: t.string
  },
  'RefusedResponse'
)
type RefusedResponse = t.TypeOf<typeof RefusedResponse>

const PeerConnectedResponse = t.type(
  {
    type: t.literal('PeerConnected')
  },
  'PeerConnectedResponse'
)

const PeerDisconnectedResponse = t.type(
  {
    type: t.literal('PeerDisconnected')
  },
  'PeerDisconnectedResponse'
)

const AckResponse = t.type({
  type: t.literal('Ack')
})
export type AckResponse = t.TypeOf<typeof AckResponse>

export const Response = t.union(
  [
    AuthorizedResponse,
    RefusedResponse,
    PeerConnectedResponse,
    PeerDisconnectedResponse,
    AckResponse
  ],
  'Response'
)
export type Response = t.TypeOf<typeof Response>
