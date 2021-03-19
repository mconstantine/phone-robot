import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { Response } from './domain'

interface InitialState {
  type: 'Initial'
}

interface AuthorizedState {
  type: 'Authorized'
}

interface RefusedState {
  type: 'Refused'
  reason: string
}

interface HandshakingState {
  type: 'Handshaking'
}

export type HomePageState =
  | InitialState
  | AuthorizedState
  | RefusedState
  | HandshakingState

export function foldHomePageState<T>(
  whenInitial: IO<T>,
  whenAuthorized: Reader<AuthorizedState, T>,
  whenHandShaking: Reader<HandshakingState, T>,
  whenRefused: Reader<RefusedState, T>
): Reader<HomePageState, T> {
  return state => {
    switch (state.type) {
      case 'Initial':
        return whenInitial()
      case 'Authorized':
        return whenAuthorized(state)
      case 'Refused':
        return whenRefused(state)
      case 'Handshaking':
        return whenHandShaking(state)
    }
  }
}

export function homePageReducer(
  state: HomePageState,
  response: Response
): HomePageState {
  switch (state.type) {
    case 'Initial':
      switch (response.type) {
        case 'Authorized':
          return {
            type: 'Authorized'
          }
        case 'Refused':
          return {
            type: 'Refused',
            reason: response.reason
          }
        case 'PeerConnected':
          return state
        case 'PeerDisconnected':
          return state
      }
    case 'Authorized':
      switch (response.type) {
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
