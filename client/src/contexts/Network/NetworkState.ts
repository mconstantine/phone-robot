import { Lazy } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { RefusalReason } from '../../globalDomain'

interface ConnectingNetworkState {
  type: 'Connecting'
}

interface AuthorizingNetworkState {
  type: 'Authorizing'
}

interface WaitingForPeerNetworkState {
  type: 'WaitingForPeer'
}

interface HandshakingNetworkState {
  type: 'Handshaking'
  sentMessagesCount: number
}

interface OperatingNetworkState {
  type: 'Operating'
}

interface ErrorState {
  type: 'Error'
  reason: RefusalReason
  message: string
}

export type NetworkState =
  | ConnectingNetworkState
  | AuthorizingNetworkState
  | WaitingForPeerNetworkState
  | HandshakingNetworkState
  | OperatingNetworkState
  | ErrorState

export function foldNetworkState<T>(
  matches: {
    [k in NetworkState['type']]: Reader<Extract<NetworkState, { type: k }>, T>
  }
): Reader<NetworkState, T> {
  return state => matches[state.type](state as any)
}

export function foldPartialNetworkState<T>(
  matches: Partial<
    {
      [k in NetworkState['type']]: Reader<Extract<NetworkState, { type: k }>, T>
    }
  >,
  defaultValue: Lazy<T>
): Reader<NetworkState, T> {
  return state => matches[state.type]?.(state as any) ?? defaultValue()
}

interface ConnectionAction {
  type: 'Connected'
}

interface AuthorizationAction {
  type: 'Authorized'
}

interface PeerConnectedAction {
  type: 'PeerConnected'
}

interface PeerDisconnectedAction {
  type: 'PeerDisconnected'
}

interface RegisterHandshakeSentAction {
  type: 'RegisterHandshakeSent'
}

interface StartOperatingAction {
  type: 'StartOperating'
}

interface ResetAction {
  type: 'Reset'
}

interface ErrorAction {
  type: 'Error'
  reason: RefusalReason
  message: string
}

type NetworkAction =
  | ConnectionAction
  | AuthorizationAction
  | PeerConnectedAction
  | PeerDisconnectedAction
  | RegisterHandshakeSentAction
  | StartOperatingAction
  | ResetAction
  | ErrorAction

export function networkReducer(
  state: NetworkState,
  action: NetworkAction
): NetworkState {
  switch (state.type) {
    case 'Connecting':
      switch (action.type) {
        case 'Connected':
          return {
            type: 'Authorizing'
          }
        case 'Authorized':
          return state
        case 'PeerConnected':
          return state
        case 'PeerDisconnected':
          return state
        case 'RegisterHandshakeSent':
          return state
        case 'StartOperating':
          return state
        case 'Error':
          return {
            type: 'Error',
            reason: action.reason,
            message: action.message
          }
        case 'Reset':
          return state
      }
    case 'Authorizing':
      switch (action.type) {
        case 'Connected':
          return state
        case 'Authorized':
          return {
            type: 'WaitingForPeer'
          }
        case 'PeerConnected':
          return state
        case 'PeerDisconnected':
          return state
        case 'RegisterHandshakeSent':
          return state
        case 'StartOperating':
          return state
        case 'Error':
          return {
            type: 'Error',
            reason: action.reason,
            message: action.message
          }
        case 'Reset':
          return {
            type: 'Connecting'
          }
      }
    case 'WaitingForPeer':
      switch (action.type) {
        case 'Connected':
          return state
        case 'Authorized':
          return state
        case 'PeerConnected':
          return {
            type: 'Handshaking',
            sentMessagesCount: 0
          }
        case 'PeerDisconnected':
          return state
        case 'RegisterHandshakeSent':
          return state
        case 'StartOperating':
          return state
        case 'Error':
          return {
            type: 'Error',
            reason: action.reason,
            message: action.message
          }
        case 'Reset':
          return {
            type: 'Connecting'
          }
      }
    case 'Handshaking':
      switch (action.type) {
        case 'Connected':
          return state
        case 'Authorized':
          return state
        case 'PeerConnected':
          return state
        case 'PeerDisconnected':
          return {
            type: 'WaitingForPeer'
          }
        case 'RegisterHandshakeSent':
          return {
            type: 'Handshaking',
            sentMessagesCount: state.sentMessagesCount + 1
          }
        case 'StartOperating':
          return {
            type: 'Operating'
          }
        case 'Error':
          return {
            type: 'Error',
            reason: action.reason,
            message: action.message
          }
        case 'Reset':
          return {
            type: 'Connecting'
          }
      }
    case 'Operating':
      switch (action.type) {
        case 'Connected':
          return state
        case 'Authorized':
          return state
        case 'PeerConnected':
          return state
        case 'PeerDisconnected':
          return {
            type: 'WaitingForPeer'
          }
        case 'RegisterHandshakeSent':
          return state
        case 'StartOperating':
          return state
        case 'Error':
          return {
            type: 'Error',
            reason: action.reason,
            message: action.message
          }
        case 'Reset':
          return {
            type: 'Connecting'
          }
      }
    case 'Error':
      switch (action.type) {
        case 'Connected':
          return state
        case 'Authorized':
          return state
        case 'PeerConnected':
          return state
        case 'PeerDisconnected':
          return state
        case 'RegisterHandshakeSent':
          return state
        case 'StartOperating':
          return state
        case 'Error':
          return state
        case 'Reset':
          return {
            type: 'Connecting'
          }
      }
  }
}
