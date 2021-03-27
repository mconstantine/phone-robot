import { Lazy } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { AckResponse, RefusalReason } from '../../globalDomain'

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
  receivedMessagesCount: number
  minRTT: number
  maxRTT: number
  lastMessageSentAt: Date
}

interface OperatingNetworkState {
  type: 'Operating'
  minRTT: number
  maxRTT: number
  lastMessageSentAt: Date
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

interface RegisterAckAction {
  type: 'RegisterAck'
  ack: AckResponse
  nextHandshakingMessageSentAt: Date
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
  | RegisterAckAction
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
        case 'RegisterAck':
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
        case 'RegisterAck':
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
    case 'WaitingForPeer':
      switch (action.type) {
        case 'Connected':
          return state
        case 'Authorized':
          return state
        case 'PeerConnected':
          return {
            type: 'Handshaking',
            receivedMessagesCount: 0,
            minRTT: 0,
            maxRTT: 0,
            lastMessageSentAt: new Date(0)
          }
        case 'PeerDisconnected':
          return state
        case 'RegisterAck':
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
        case 'RegisterAck':
          const lastMessageRTT =
            state.lastMessageSentAt.getTime() === 0
              ? 0
              : action.nextHandshakingMessageSentAt.getTime() -
                state.lastMessageSentAt.getTime()

          const minRTT = Math.min(state.minRTT, lastMessageRTT)
          const maxRTT = Math.max(state.maxRTT, lastMessageRTT)
          const newReceivedMessagesCount = state.receivedMessagesCount + 1

          return {
            type: 'Handshaking',
            receivedMessagesCount: newReceivedMessagesCount,
            minRTT,
            maxRTT,
            lastMessageSentAt: action.nextHandshakingMessageSentAt
          }
        case 'StartOperating':
          return {
            type: 'Operating',
            minRTT: state.minRTT,
            maxRTT: state.maxRTT,
            lastMessageSentAt: state.lastMessageSentAt
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
        case 'RegisterAck':
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
        case 'RegisterAck':
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
