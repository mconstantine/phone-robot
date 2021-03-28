import { either, option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Option } from 'fp-ts/Option'
import { Reader } from 'fp-ts/Reader'
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState
} from 'react'
import { Message, Response } from '../../globalDomain'
import { refreshToken } from '../../useApi'
import { useAccount } from '../Account/Account'
import { webSocketReducer, WebSocketState } from './WebSocketState'

interface WebSocketContext {
  webSocketState: WebSocketState
  sendMessage: Reader<Message, void>
  clearResponse: IO<void>
}

const WebSocketContext = createContext<WebSocketContext>({
  webSocketState: {
    type: 'Initial'
  },
  sendMessage: constVoid,
  clearResponse: constVoid
})

export function WebSocketProvider(props: PropsWithChildren<{}>) {
  const constConnection = () => new WebSocket(process.env.REACT_APP_WS_URL!)
  const reconnectTimeout = useRef<Option<number>>(option.none)
  const [connection, setConnection] = useState(constConnection)
  const { account, dispatchAccountAction } = useAccount()

  const [state, dispatch] = useReducer(webSocketReducer, {
    type: 'Initial'
  })

  const sendMessage = (message: Message) =>
    connection.send(pipe(message, Message.encode, JSON.stringify))

  const clearResponse = () => dispatch({ type: 'ClearResponse' })

  connection.onerror = () => dispatch({ type: 'Error' })

  connection.onclose = () => {
    dispatch({ type: 'Close' })

    reconnectTimeout.current = option.some(
      window.setTimeout(() => setConnection(constConnection), 10000)
    )
  }

  connection.onopen = () =>
    dispatch({
      type: 'Open',
      sendMessage
    })

  connection.onmessage = response =>
    pipe(
      response.data,
      data => either.tryCatch(() => JSON.parse(data), constVoid),
      either.chainW(Response.decode),
      either.fold(constVoid, response => {
        if (response.type === 'Refused' && response.reason === 'Forbidden') {
          const tryRefreshingToken = pipe(
            refreshToken(account, dispatchAccountAction)
          )

          tryRefreshingToken()
        } else {
          dispatch({
            type: 'SetResponse',
            response
          })
        }
      })
    )

  useEffect(() => {
    return () => {
      connection.close()

      pipe(
        reconnectTimeout.current,
        option.fold(constVoid, timeout => {
          window.clearTimeout(timeout)
          reconnectTimeout.current = option.none
        })
      )
    }
  }, [connection])

  return (
    <WebSocketContext.Provider
      value={{ webSocketState: state, sendMessage, clearResponse }}
    >
      {props.children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  return useContext(WebSocketContext)
}
