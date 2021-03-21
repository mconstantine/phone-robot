import { Reader } from 'fp-ts/Reader'
import { AckResponse } from '../../components/Home/domain'

interface InitialNetworkState {
  type: 'Initial'
}

interface HandshakingNetworkState {
  type: 'Handshaking'
  receivedMessagesCount: number
  averageRTT: number
  lastMessageSentAt: Date
}

interface OperatingNetworkState {
  type: 'Operating'
  receivedMessagesCount: number
  averageRTT: number
  lastMessageSentAt: Date
}

export type NetworkState =
  | InitialNetworkState
  | HandshakingNetworkState
  | OperatingNetworkState

export function foldNetworkState<T>(
  whenInitial: Reader<InitialNetworkState, T>,
  whenHandshaking: Reader<HandshakingNetworkState, T>,
  whenOperating: Reader<OperatingNetworkState, T>
): Reader<NetworkState, T> {
  return state => {
    switch (state.type) {
      case 'Initial':
        return whenInitial(state)
      case 'Handshaking':
        return whenHandshaking(state)
      case 'Operating':
        return whenOperating(state)
    }
  }
}

interface StartHandshakingAction {
  type: 'StartHandshaking'
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

type NetworkAction =
  | StartHandshakingAction
  | RegisterAckAction
  | StartOperatingAction
  | ResetAction

export function networkReducer(
  state: NetworkState,
  action: NetworkAction
): NetworkState {
  switch (state.type) {
    case 'Initial':
      switch (action.type) {
        case 'StartHandshaking':
          return {
            type: 'Handshaking',
            receivedMessagesCount: 0,
            averageRTT: 0,
            lastMessageSentAt: new Date(0)
          }
        case 'RegisterAck':
          return state
        case 'StartOperating':
          return state
        case 'Reset':
          return state
      }
    case 'Handshaking':
      switch (action.type) {
        case 'StartHandshaking':
          return state
        case 'RegisterAck':
          const lastMessageRTT =
            action.nextHandshakingMessageSentAt.getTime() -
            state.lastMessageSentAt.getTime()

          const newReceivedMessagesCount = state.receivedMessagesCount + 1

          return {
            type: 'Handshaking',
            receivedMessagesCount: newReceivedMessagesCount,
            averageRTT:
              (state.averageRTT * state.receivedMessagesCount +
                lastMessageRTT) /
              newReceivedMessagesCount,
            lastMessageSentAt: action.nextHandshakingMessageSentAt
          }
        case 'StartOperating':
          return {
            type: 'Operating',
            receivedMessagesCount: state.receivedMessagesCount,
            averageRTT: state.averageRTT,
            lastMessageSentAt: state.lastMessageSentAt
          }
        case 'Reset':
          return {
            type: 'Initial'
          }
      }
    case 'Operating':
      switch (action.type) {
        case 'StartHandshaking':
          return state
        case 'RegisterAck':
          return state
        case 'StartOperating':
          return state
        case 'Reset':
          return {
            type: 'Initial'
          }
      }
  }
}
