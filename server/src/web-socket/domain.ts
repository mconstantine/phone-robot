import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import * as t from 'io-ts'
import { NonEmptyString } from 'io-ts-types'

export const Actor = t.keyof(
  {
    UI: 'UI',
    Robot: 'Robot'
  },
  'Actor'
)
export type Actor = t.TypeOf<typeof Actor>

export function foldActor<T>(
  whenUI: IO<T>,
  whenRobot: IO<T>
): Reader<Actor, T> {
  return actor => {
    switch (actor) {
      case 'UI':
        return whenUI()
      case 'Robot':
        return whenRobot()
    }
  }
}

const AuthorizationMessage = t.type(
  {
    type: t.literal('Authorization'),
    from: Actor,
    accessToken: NonEmptyString
  },
  'AuthorizationMessage'
)
export type AuthorizationMessage = t.TypeOf<typeof AuthorizationMessage>

const ResetMessage = t.type(
  {
    type: t.literal('Reset'),
    from: Actor
  },
  'Reset'
)
export type ResetMessage = t.TypeOf<typeof ResetMessage>

export const Message = t.union([AuthorizationMessage, ResetMessage], 'Message')
export type Message = t.TypeOf<typeof Message>

export function foldMessage<T>(
  whenAuthorization: Reader<AuthorizationMessage, T>,
  whenReset: Reader<ResetMessage, T>
): Reader<Message, T> {
  return message => {
    switch (message.type) {
      case 'Authorization':
        return whenAuthorization(message)
      case 'Reset':
        return whenReset(message)
    }
  }
}

const AuthorizedResponse = t.type(
  {
    type: t.literal('Authorized')
  },
  'AuthorizedResponse'
)

const RefusalReason = t.keyof(
  {
    ConnectionBusy: true,
    Forbidden: true
  },
  'RefusalReason'
)
export type RefusalReason = t.TypeOf<typeof RefusalReason>

const RefusedResponse = t.type(
  {
    type: t.literal('Refused'),
    reason: RefusalReason,
    message: t.string
  },
  'RefusedResponse'
)

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

export const Response = t.union(
  [
    AuthorizedResponse,
    RefusedResponse,
    PeerConnectedResponse,
    PeerDisconnectedResponse
  ],
  'Response'
)
export type Response = t.TypeOf<typeof Response>
