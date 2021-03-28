import { Reader } from 'fp-ts/Reader'
import { Option } from 'fp-ts/Option'
import { option } from 'fp-ts'
import { Message, Response } from '../../globalDomain'
import { Lazy } from 'fp-ts/function'

interface InitialWebSocketState {
  type: 'Initial'
}

interface OpenWebSocketState {
  type: 'Open'
  response: Option<Response>
}

interface ConnectionFailedWebSocketState {
  type: 'ConnectionFailed'
}

interface ClosedWebSocketState {
  type: 'Closed'
}

export type WebSocketState =
  | InitialWebSocketState
  | OpenWebSocketState
  | ConnectionFailedWebSocketState
  | ClosedWebSocketState

export function foldWebSocketState<T>(
  matches: {
    [k in WebSocketState['type']]: Reader<
      Extract<WebSocketState, { type: k }>,
      T
    >
  }
): Reader<WebSocketState, T> {
  return state => matches[state.type](state as any)
}

export function foldPartialWebSocketState<T>(
  matches: Partial<
    {
      [k in WebSocketState['type']]: Reader<
        Extract<WebSocketState, { type: k }>,
        T
      >
    }
  >,
  defaultValue: Lazy<T>
): Reader<WebSocketState, T> {
  return state => matches[state.type]?.(state as any) ?? defaultValue()
}

interface OpenWebSocketAction {
  type: 'Open'
  sendMessage: Reader<Message, void>
}

interface SetResponseWebSocketAction {
  type: 'SetResponse'
  response: Response
}

interface ClearResponseWebSocketAction {
  type: 'ClearResponse'
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
  | ClearResponseWebSocketAction
  | SetErrorWebSocketAction
  | CloseWebSocketAction

export function webSocketReducer(
  state: WebSocketState,
  action: WebSocketAction
): WebSocketState {
  switch (state.type) {
    case 'Initial':
      switch (action.type) {
        case 'Open':
          return {
            type: 'Open',
            response: option.none
          }
        case 'Close':
          return state
        case 'SetResponse':
          return state
        case 'ClearResponse':
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
            response: option.some(action.response)
          }
        case 'ClearResponse':
          return {
            type: 'Open',
            response: option.none
          }
        case 'Error':
          return {
            type: 'ConnectionFailed'
          }
      }
    case 'Closed':
      switch (action.type) {
        case 'Open':
          return {
            type: 'Open',
            response: option.none
          }
        case 'Close':
          return state
        case 'SetResponse':
          return state
        case 'ClearResponse':
          return state
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
            response: option.none
          }
        case 'Close':
          return {
            type: 'Closed'
          }
        case 'SetResponse':
          return state
        case 'ClearResponse':
          return state
        case 'Error':
          return state
      }
  }
}
