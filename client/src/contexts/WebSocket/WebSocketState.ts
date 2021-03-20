import { Reader } from 'fp-ts/Reader'
import { Option } from 'fp-ts/Option'
import { Message, Response } from '../../components/Home/domain'
import { option } from 'fp-ts'

interface ClosedWebSocketState {
  type: 'Closed'
}

interface OpenWebSocketState {
  type: 'Open'
  response: Option<Response>
  sendMessage: Reader<Message, void>
}

interface ConnectionFailedWebSocketState {
  type: 'ConnectionFailed'
}

export type WebSocketState =
  | ClosedWebSocketState
  | OpenWebSocketState
  | ConnectionFailedWebSocketState

export function foldWebSocketState<T>(
  whenClosed: Reader<ClosedWebSocketState, T>,
  whenOpen: Reader<OpenWebSocketState, T>,
  whenConnectionFailed: Reader<ConnectionFailedWebSocketState, T>
): Reader<WebSocketState, T> {
  return state => {
    switch (state.type) {
      case 'Closed':
        return whenClosed(state)
      case 'Open':
        return whenOpen(state)
      case 'ConnectionFailed':
        return whenConnectionFailed(state)
    }
  }
}

interface OpenWebSocketAction {
  type: 'Open'
  sendMessage: Reader<Message, void>
}

interface SetResponseWebSocketAction {
  type: 'SetResponse'
  response: Response
}

interface SetErrorWebSocketAction {
  type: 'Error'
}

interface CloseWebSocketAction {
  type: 'Close'
}

export type WebSocketAction =
  | OpenWebSocketAction
  | SetResponseWebSocketAction
  | SetErrorWebSocketAction
  | CloseWebSocketAction

export function webSocketReducer(
  state: WebSocketState,
  action: WebSocketAction
): WebSocketState {
  switch (state.type) {
    case 'Closed':
      switch (action.type) {
        case 'Open':
          return {
            type: 'Open',
            response: option.none,
            sendMessage: action.sendMessage
          }
        case 'Close':
          return state
        case 'SetResponse':
          return state
        case 'Error':
          return {
            type: 'ConnectionFailed'
          }
      }
    case 'Open':
      switch (action.type) {
        case 'Open':
          return state
        case 'Close':
          return {
            type: 'Closed'
          }
        case 'SetResponse':
          return {
            type: 'Open',
            response: option.some(action.response),
            sendMessage: state.sendMessage
          }
        case 'Error':
          return {
            type: 'ConnectionFailed'
          }
      }
    case 'ConnectionFailed':
      switch (action.type) {
        case 'Open':
          return {
            type: 'Open',
            response: option.none,
            sendMessage: action.sendMessage
          }
        case 'Close':
          return {
            type: 'Closed'
          }
        case 'SetResponse':
          return state
        case 'Error':
          return state
      }
  }
}
