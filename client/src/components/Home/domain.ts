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

const ResetMessage = t.type(
  {
    type: t.literal('Reset'),
    from: From
  },
  'ResetMessage'
)
export type ResetMessage = t.TypeOf<typeof ResetMessage>

export const Message = t.union([AuthorizationMessage, ResetMessage], 'Message')
export type Message = t.TypeOf<typeof Message>

const AuthorizedResponse = t.type(
  {
    type: t.literal('Authorized')
  },
  'AuthorizedResponse'
)
type AuthorizedResponse = t.TypeOf<typeof AuthorizedResponse>

const RefusedResponse = t.type(
  {
    type: t.literal('Refused'),
    reason: t.string
  },
  'RefusedResponse'
)
type RefusedResponse = t.TypeOf<typeof RefusedResponse>

export const Response = t.union(
  [AuthorizedResponse, RefusedResponse],
  'Response'
)
export type Response = t.TypeOf<typeof Response>
