import * as t from 'io-ts'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { NonEmptyString } from 'io-ts-types'
import { Lazy } from 'fp-ts/function'

interface PositiveIntegerBrand {
  readonly PositiveInteger: unique symbol
}
export const PositiveInteger = t.brand(
  t.Int,
  (n): n is t.Branded<t.Int, PositiveIntegerBrand> => n > 0,
  'PositiveInteger'
)
export type PositiveInteger = t.TypeOf<typeof PositiveInteger>

interface PercentageBrand {
  readonly Percentage: unique symbol
}
export const Percentage = t.brand(
  t.number,
  (n): n is t.Branded<number, PercentageBrand> => n >= 0 && n <= 1,
  'Percentage'
)
export type Percentage = t.TypeOf<typeof Percentage>

function unsafePercentage(n: number): Percentage {
  if (!Percentage.is(n)) {
    throw new Error(`Called unsafePercentage with invalid number: ${n}`)
  }

  return n
}

export function getPercentage(fraction: number, whole: number): Percentage {
  return unsafePercentage(fraction / whole)
}

interface DegreesAngleBrand {
  readonly DegreesAngle: unique symbol
}
export const DegreesAngle = t.brand(
  t.Int,
  (n): n is t.Branded<t.Int, DegreesAngleBrand> => n >= 0 && n <= 360,
  'DegreesAngle'
)
export type DegreesAngle = t.TypeOf<typeof DegreesAngle>

function unsafeDegreesAngle(n: number): DegreesAngle {
  if (!DegreesAngle.is(n)) {
    throw new Error(`Called unsafeDegreesAngle with invalid number: ${n}`)
  }

  return n
}

export function degreesAngleFromRadians(radians: number): DegreesAngle {
  let angle = Math.round((radians / Math.PI) * 180)

  if (angle < 0) {
    angle = 360 + angle
  } else if (angle === -0) {
    angle = 0
  }

  return unsafeDegreesAngle(angle)
}

export function radiansAngleFromDegrees(angle: DegreesAngle): number {
  return (angle / 180) * Math.PI
}

const From = t.literal('UI')

const AuthorizationMessage = t.type(
  {
    type: t.literal('Authorization'),
    from: From,
    accessToken: NonEmptyString
  },
  'AuthorizationMessage'
)
type AuthorizationMessage = t.TypeOf<typeof AuthorizationMessage>

const HandshakingMessage = t.type(
  {
    type: t.literal('Handshaking'),
    from: From
  },
  'HandshakingMessage'
)
type HandshakingMessage = t.TypeOf<typeof HandshakingMessage>

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
    from: From,
    command: Command
  },
  'CommandMessage'
)

export const Message = t.union(
  [AuthorizationMessage, HandshakingMessage, CommandMessage],
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

export function foldResponse<T>(
  matches: {
    [k in Response['type']]: Reader<Extract<Response, { type: k }>, T>
  }
): Reader<Response, T> {
  return response => matches[response.type](response as any)
}

export function foldPartialResponse<T>(
  matches: Partial<
    {
      [k in Response['type']]: Reader<Extract<Response, { type: k }>, T>
    }
  >,
  defaultValue: Lazy<T>
): Reader<Response, T> {
  return response => matches[response.type]?.(response as any) ?? defaultValue()
}
