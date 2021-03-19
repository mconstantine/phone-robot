import { Reader } from 'fp-ts/Reader'

interface IdleState {
  type: 'Idle'
}

interface AuthorizedState {
  type: 'Authorized'
}

interface HandshakingState {
  type: 'Handshaking'
}

export type State = IdleState | AuthorizedState | HandshakingState

export function foldState<T>(
  whenIdle: Reader<IdleState, T>,
  whenAuthorized: Reader<AuthorizedState, T>,
  whenHandshaking: Reader<HandshakingState, T>
): Reader<State, T> {
  return state => {
    switch (state.type) {
      case 'Idle':
        return whenIdle(state)
      case 'Authorized':
        return whenAuthorized(state)
      case 'Handshaking':
        return whenHandshaking(state)
    }
  }
}

interface AuthorizationAction {
  type: 'Authorization'
}

interface ResetAction {
  type: 'Reset'
}

interface PeerConnectedAction {
  type: 'PeerConnected'
}

interface PeerDisconnectedAction {
  type: 'PeerDisconnected'
}

export type Action =
  | AuthorizationAction
  | ResetAction
  | PeerConnectedAction
  | PeerDisconnectedAction

export function updateState(state: State, action: Action): State {
  switch (state.type) {
    case 'Idle':
      switch (action.type) {
        case 'Authorization':
          return {
            type: 'Authorized'
          }
        case 'Reset':
          return state
        case 'PeerConnected':
          return state
        case 'PeerDisconnected':
          return state
      }
    case 'Authorized':
      switch (action.type) {
        case 'Authorization':
          return state
        case 'Reset':
          return {
            type: 'Idle'
          }
        case 'PeerConnected':
          return {
            type: 'Handshaking'
          }
        case 'PeerDisconnected':
          return state
      }
    case 'Handshaking':
      switch (action.type) {
        case 'Authorization':
          return state
        case 'Reset':
          return {
            type: 'Idle'
          }
        case 'PeerConnected':
          return state
        case 'PeerDisconnected':
          return {
            type: 'Authorized'
          }
      }
  }
}
