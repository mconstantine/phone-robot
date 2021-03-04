import { constVoid } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import * as t from 'io-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { createContext, PropsWithChildren, useContext, useReducer } from 'react'

const AnonymousAccount = t.type(
  {
    type: t.literal('Anonymous')
  },
  'AnonymousAccount'
)
type AnonymousAccount = t.TypeOf<typeof AnonymousAccount>

const LoggedInAccount = t.type(
  {
    type: t.literal('LoggedIn'),
    accessToken: NonEmptyString,
    refreshToken: NonEmptyString,
    expiration: DateFromISOString
  },
  'LoggedInAccount'
)
type LoggedInAccount = t.TypeOf<typeof LoggedInAccount>

export const AccountState = t.union(
  [AnonymousAccount, LoggedInAccount],
  'AccountState'
)
export type AccountState = t.TypeOf<typeof AccountState>

export function foldAccount<T>(
  whenAnonymous: (account: AnonymousAccount) => T,
  whenLoggedIn: (account: LoggedInAccount) => T
): (account: AccountState) => T {
  return account => {
    switch (account.type) {
      case 'Anonymous':
        return whenAnonymous(account)
      case 'LoggedIn':
        return whenLoggedIn(account)
    }
  }
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

type Action = LoginAction | LogoutAction | RefreshTokenAction

function accountReducer(state: AccountState, action: Action): AccountState {
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

interface AccountContext {
  account: AccountState
  dispatchAccountAction: Reader<Action, void>
}

const AccountContext = createContext<AccountContext>({
  account: { type: 'Anonymous' },
  dispatchAccountAction: constVoid
})

interface Props {}

export function Account(props: PropsWithChildren<Props>) {
  const [account, dispatchAccountAction] = useReducer(accountReducer, {
    type: 'Anonymous'
  })

  return (
    <AccountContext.Provider value={{ account, dispatchAccountAction }}>
      {props.children}
    </AccountContext.Provider>
  )
}

export function useAccount(): AccountContext {
  return useContext(AccountContext)
}
