import { Reader } from 'fp-ts/Reader'
import { Response, RefusalReason } from './domain'

interface InitialState {
  type: 'Initial'
}

interface WebSocketConnectionErrorState {
  type: 'WebSocketConnectionError'
}

interface AuthorizedState {
  type: 'Authorized'
}

interface RefusedState {
  type: 'Refused'
  reason: RefusalReason
  message: string
}

interface HandshakingState {
  type: 'Handshaking'
}

export type HomePageState =
  | InitialState
  | WebSocketConnectionErrorState
  | AuthorizedState
  | RefusedState
  | HandshakingState

export function foldHomePageState<T>(
  whenInitial: Reader<InitialState, T>,
  whenWebSocketConnectionError: Reader<WebSocketConnectionErrorState, T>,
  whenAuthorized: Reader<AuthorizedState, T>,
  whenHandShaking: Reader<HandshakingState, T>,
  whenRefused: Reader<RefusedState, T>
): Reader<HomePageState, T> {
  return state => {
    switch (state.type) {
      case 'Initial':
        return whenInitial(state)
      case 'WebSocketConnectionError':
        return whenWebSocketConnectionError(state)
      case 'Authorized':
        return whenAuthorized(state)
      case 'Refused':
        return whenRefused(state)
      case 'Handshaking':
        return whenHandShaking(state)
    }
  }
}

interface WebSocketConnectionError {
  type: 'WebSocketConnectionError'
}

type HomePageAction = Response | WebSocketConnectionError

export function homePageReducer(
  state: HomePageState,
  response: HomePageAction
): HomePageState {
  switch (state.type) {
    case 'Initial':
      switch (response.type) {
        case 'WebSocketConnectionError':
          return {
            type: 'WebSocketConnectionError'
          }
        case 'Authorized':
          return {
            type: 'Authorized'
          }
        case 'Refused':
          return {
            type: 'Refused',
            reason: response.reason,
            message: response.message
          }
        case 'PeerConnected':
          return state
        case 'PeerDisconnected':
          return state
      }
    case 'WebSocketConnectionError':
      switch (response.type) {
        case 'WebSocketConnectionError':
          return state
        case 'Authorized':
          return state
        case 'Refused':
          return state
        case 'PeerConnected':
          return state
        case 'PeerDisconnected':
          return state
      }
    case 'Authorized':
      switch (response.type) {
        case 'WebSocketConnectionError':
          return {
            type: 'WebSocketConnectionError'
          }
        case 'Authorized':
          return state
        case 'Refused':
          return state
        case 'PeerConnected':
          return {
            type: 'Handshaking'
          }
        case 'PeerDisconnected':
          return state
      }
    case 'Refused':
      switch (response.type) {
        case 'WebSocketConnectionError':
          return {
            type: 'WebSocketConnectionError'
          }
        case 'Authorized':
          return { type: 'Authorized' }
        case 'Refused':
          return state
        case 'PeerConnected':
          return state
        case 'PeerDisconnected':
          return state
      }
    case 'Handshaking':
      switch (response.type) {
        case 'WebSocketConnectionError':
          return {
            type: 'WebSocketConnectionError'
          }
        case 'Authorized':
          return state
        case 'Refused':
          return state
        case 'PeerConnected':
          return state
        case 'PeerDisconnected':
          return { type: 'Authorized' }
      }
  }
}
