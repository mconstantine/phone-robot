import { option } from 'fp-ts'
import { Lazy } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { Reader } from 'fp-ts/Reader'
import { AckResponse, Command, RefusalReason } from '../../globalDomain'

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
  isAwaitingForAck: boolean
}

interface OperatingNetworkState {
  type: 'Operating'
  minRTT: number
  maxRTT: number
  lastMessageSentAt: Date
  command: Option<Command>
  isAwaitingForAck: boolean
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

interface RegisterAckAction {
  type: 'RegisterAck'
  ack: AckResponse
}

interface RegisterCommandAction {
  type: 'RegisterCommand'
  command: Option<Command>
}

interface RegisterCommandSentAction {
  type: 'RegisterCommandSent'
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
  | RegisterCommandAction
  | RegisterCommandSentAction
  | RegisterAckAction
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
        case 'RegisterCommand':
          return state
        case 'RegisterCommandSent':
          return state
        case 'RegisterAck':
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
        case 'RegisterCommand':
          return state
        case 'RegisterCommandSent':
          return state
        case 'RegisterAck':
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
            receivedMessagesCount: 0,
            minRTT: 0,
            maxRTT: 0,
            lastMessageSentAt: new Date(),
            isAwaitingForAck: false
          }
        case 'PeerDisconnected':
          return state
        case 'RegisterHandshakeSent':
          return state
        case 'StartOperating':
          return state
        case 'RegisterCommand':
          return state
        case 'RegisterCommandSent':
          return state
        case 'RegisterAck':
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
            receivedMessagesCount: state.receivedMessagesCount,
            minRTT: state.minRTT,
            maxRTT: state.maxRTT,
            lastMessageSentAt: new Date(),
            isAwaitingForAck: true
          }
        case 'StartOperating':
          return {
            type: 'Operating',
            minRTT: state.minRTT,
            maxRTT: state.maxRTT,
            lastMessageSentAt: state.lastMessageSentAt,
            command: option.none,
            isAwaitingForAck: false
          }
        case 'RegisterCommand':
          return state
        case 'RegisterCommandSent':
          return state
        case 'RegisterAck':
          if (state.isAwaitingForAck) {
            const lastMessageRTT =
              Date.now() - state.lastMessageSentAt.getTime()
            const minRTT = Math.min(state.minRTT, lastMessageRTT)

            const maxRTT =
              lastMessageRTT > state.maxRTT + 1000
                ? state.maxRTT
                : Math.max(state.maxRTT, lastMessageRTT)

            const newReceivedMessagesCount = state.receivedMessagesCount + 1

            return {
              type: 'Handshaking',
              receivedMessagesCount: newReceivedMessagesCount,
              minRTT,
              maxRTT,
              lastMessageSentAt: state.lastMessageSentAt,
              isAwaitingForAck: false
            }
          } else {
            return state
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
        case 'RegisterCommand':
          return {
            type: 'Operating',
            maxRTT: state.maxRTT,
            minRTT: state.minRTT,
            lastMessageSentAt: state.lastMessageSentAt,
            command: action.command,
            isAwaitingForAck: state.isAwaitingForAck
          }
        case 'RegisterCommandSent':
          return {
            type: 'Operating',
            maxRTT: state.maxRTT,
            minRTT: state.minRTT,
            lastMessageSentAt: new Date(),
            command: state.command,
            isAwaitingForAck: true
          }
        case 'RegisterAck':
          if (state.isAwaitingForAck) {
            const lastMessageRTT =
              Date.now() - state.lastMessageSentAt.getTime()
            const minRTT = Math.min(state.minRTT, lastMessageRTT)

            const maxRTT =
              lastMessageRTT > state.maxRTT + 1000
                ? state.maxRTT
                : Math.max(state.maxRTT, lastMessageRTT)

            return {
              type: 'Operating',
              minRTT,
              maxRTT,
              lastMessageSentAt: state.lastMessageSentAt,
              command: state.command,
              isAwaitingForAck: false
            }
          } else {
            return state
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
        case 'RegisterCommand':
          return state
        case 'RegisterCommandSent':
          return state
        case 'RegisterAck':
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
