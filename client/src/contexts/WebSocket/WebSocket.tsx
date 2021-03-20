import { either } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useReducer
} from 'react'
import { Message, Response } from '../../components/Home/domain'
import { refreshToken } from '../../useApi'
import { useAccount } from '../Account/Account'
import { webSocketReducer, WebSocketState } from './WebSocketState'

const WebSocketContext = createContext<WebSocketState>({
  type: 'Closed'
})

export function WebSocketProvider(props: PropsWithChildren<{}>) {
  const connection = useMemo(
    () => new WebSocket(process.env.REACT_APP_WS_URL!),
    []
  )
  const { account, dispatchAccountAction } = useAccount()

  const [state, dispatch] = useReducer(webSocketReducer, {
    type: 'Closed'
  })

  const sendMessage = (message: Message) =>
    connection.send(pipe(message, Message.encode, JSON.stringify))

  connection.onerror = () => dispatch({ type: 'Error' })

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
