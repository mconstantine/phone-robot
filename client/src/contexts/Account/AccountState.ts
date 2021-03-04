import * as t from 'io-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'

export const AnonymousAccount = t.type(
  {
    type: t.literal('Anonymous')
  },
  'AnonymousAccount'
)
export type AnonymousAccount = t.TypeOf<typeof AnonymousAccount>

export const LoggedInAccount = t.type(
  {
    type: t.literal('LoggedIn'),
    accessToken: NonEmptyString,
    refreshToken: NonEmptyString,
    expiration: DateFromISOString
  },
  'LoggedInAccount'
)
export type LoggedInAccount = t.TypeOf<typeof LoggedInAccount>

export const AccountState = t.union(
  [AnonymousAccount, LoggedInAccount],
  'AccountState'
)
export type AccountState = t.TypeOf<typeof AccountState>

export function anonymous(): AccountState {
  return { type: 'Anonymous' }
}

interface LoginAction {
  type: 'Login'
  accessToken: NonEmptyString
  refreshToken: NonEmptyString
  expiration: Date
}

interface LogoutAction {
  type: 'Logout'
}

interface RefreshTokenAction {
  type: 'RefreshToken'
  accessToken: NonEmptyString
  refreshToken: NonEmptyString
  expiration: Date
}

export type AccountAction = LoginAction | LogoutAction | RefreshTokenAction

export function accountReducer(
  state: AccountState,
  action: AccountAction
): AccountState {
  switch (state.type) {
    case 'Anonymous':
      switch (action.type) {
        case 'Login':
          return {
            type: 'LoggedIn',
            accessToken: action.accessToken,
            refreshToken: action.refreshToken,
            expiration: action.expiration
          }
        case 'Logout':
          return state
        case 'RefreshToken':
          return state
      }
    case 'LoggedIn':
      switch (action.type) {
        case 'Login':
          return state
        case 'Logout':
          return {
            type: 'Anonymous'
          }
        case 'RefreshToken':
          return {
            type: 'LoggedIn',
            accessToken: action.accessToken,
            refreshToken: action.refreshToken,
            expiration: action.expiration
          }
      }
  }
}
