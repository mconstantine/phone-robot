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

const HandshakingMessage = t.type(
  {
    type: t.literal('Handshaking'),
    from: t.literal('UI'),
    time: t.number
  },
  'HandshakingMessage'
)
export type HandshakingMessage = t.TypeOf<typeof HandshakingMessage>

interface PercentageBrand {
  readonly Percentage: unique symbol
}
export const Percentage = t.brand(
  t.number,
  (n): n is t.Branded<number, PercentageBrand> => n >= 0 && n <= 1,
  'Percentage'
)
export type Percentage = t.TypeOf<typeof Percentage>

interface DegreesAngleBrand {
  readonly DegreesAngle: unique symbol
}
export const DegreesAngle = t.brand(
  t.Int,
  (n): n is t.Branded<t.Int, DegreesAngleBrand> => n >= 0 && n <= 360,
  'DegreesAngle'
)
export type DegreesAngle = t.TypeOf<typeof DegreesAngle>

export const Command = t.type(
  {
    speed: Percentage,
    angle: DegreesAngle
  },
  'Command'
)
export type Command = t.TypeOf<typeof Command>

const CommandMessage = t.type(
  {
    type: t.literal('Command'),
    from: t.literal('UI'),
    command: Command,
    time: t.number
  },
  'CommandMessage'
)
export type CommandMessage = t.TypeOf<typeof CommandMessage>

export const Message = t.union(
  [AuthorizationMessage, ResetMessage, HandshakingMessage, CommandMessage],
  'Message'
)
export type Message = t.TypeOf<typeof Message>

export function foldMessage<T>(
  matches: { [k in Message['type']]: Reader<Extract<Message, { type: k }>, T> }
): Reader<Message, T> {
  return message => matches[message.type](message as any)
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

const HandshakingResponse = t.type(
  {
    type: t.literal('Handshaking'),
    time: t.number
  },
  'HandshakingResponse'
)

const CommandResponse = t.type(
  {
    type: t.literal('Command'),
    command: Command,
    time: t.number
  },
  'CommandResponse'
)

export const Response = t.union(
  [
    AuthorizedResponse,
    RefusedResponse,
    PeerConnectedResponse,
    PeerDisconnectedResponse,
    HandshakingResponse,
    CommandResponse
  ],
  'Response'
)
export type Response = t.TypeOf<typeof Response>
