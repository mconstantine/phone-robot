import { either, option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer
} from 'react'
import { readStorage, writeStorage } from '../../lib/Storage'
import {
  AccountAction,
  accountReducer,
  AccountState,
  anonymous,
  AnonymousAccount,
  LoggedInAccount
} from './AccountState'

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

interface AccountContext {
  account: AccountState
  dispatchAccountAction: Reader<AccountAction, void>
}

const AccountContext = createContext<AccountContext>({
  account: { type: 'Anonymous' },
  dispatchAccountAction: constVoid
})

interface Props {}

export function Account(props: PropsWithChildren<Props>) {
  const [account, dispatchAccountAction] = useReducer(
    accountReducer,
    pipe(
      readStorage('account'),
      either.getOrElse(() => option.some(anonymous())),
      option.getOrElse(() => anonymous())
    )
  )

  useEffect(() => {
    writeStorage('account', account)
  }, [account])

  return (
    <AccountContext.Provider value={{ account, dispatchAccountAction }}>
      {props.children}
    </AccountContext.Provider>
  )
}

export function useAccount(): AccountContext {
  return useContext(AccountContext)
}
