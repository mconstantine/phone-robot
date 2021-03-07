import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { AuthorizationMessage, ResetMessage } from './domain'

interface IdleState {
  type: 'Idle'
}

interface AuthorizedState {
  type: 'Authorized'
}

export type State = IdleState | AuthorizedState
type Message = AuthorizationMessage | ResetMessage

export function foldState<T>(
  whenIdle: IO<T>,
  whenAuthorized: Reader<AuthorizedState, T>
): Reader<State, T> {
  return state => {
    switch (state.type) {
      case 'Idle':
        return whenIdle()
      case 'Authorized':
        return whenAuthorized(state)
    }
  }
}

export function reducer(state: State, message: Message): State {
  switch (state.type) {
    case 'Idle':
      switch (message.type) {
        case 'Authorization':
          return {
            type: 'Authorized'
          }
        case 'Reset':
          return state
      }
    case 'Authorized':
      switch (message.type) {
        case 'Authorization':
          return state
        case 'Reset':
          return {
            type: 'Idle'
          }
      }
  }
}
