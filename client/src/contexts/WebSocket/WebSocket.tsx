import { either } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
  useState
} from 'react'
import { Message, Response } from '../../globalDomain'
import { refreshToken } from '../../useApi'
import { useAccount } from '../Account/Account'
import { webSocketReducer, WebSocketState } from './WebSocketState'

const WebSocketContext = createContext<WebSocketState>({
  type: 'Closed'
})

export function WebSocketProvider(props: PropsWithChildren<{}>) {
  const constConnection = () => new WebSocket(process.env.REACT_APP_WS_URL!)

  const [connection, setConnection] = useState(constConnection)
  const { account, dispatchAccountAction } = useAccount()

  const [state, dispatch] = useReducer(webSocketReducer, {
    type: 'Closed'
  })

  const sendMessage = (message: Message) =>
    connection.send(pipe(message, Message.encode, JSON.stringify))

  connection.onerror = () => dispatch({ type: 'Error' })

  connection.onclose = () => {
    dispatch({ type: 'Close' })
    setTimeout(() => setConnection(constConnection), 10000)
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
    return () => connection.close()
  }, [connection])

  return (
    <WebSocketContext.Provider value={state}>
      {props.children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  return useContext(WebSocketContext)
}
