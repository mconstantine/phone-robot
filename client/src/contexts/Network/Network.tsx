import { IO } from 'fp-ts/IO'
import { constVoid, pipe } from 'fp-ts/function'
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer
} from 'react'
import { networkReducer, NetworkState } from './NetworkState'
import { useWebSocket } from '../WebSocket/WebSocket'
import { foldWebSocketState } from '../WebSocket/WebSocketState'
import { option } from 'fp-ts'

interface NetworkContext {
  networkState: NetworkState
  startHandshaking: IO<void>
}

const NetworkContext = createContext<NetworkContext>({
  networkState: { type: 'Initial' },
  startHandshaking: constVoid
})

export function NetworkProvider(props: PropsWithChildren<{}>) {
  const webSocket = useWebSocket()
  const [state, dispatch] = useReducer(networkReducer, { type: 'Initial' })

  const startHandshaking = () => {
    dispatch({ type: 'StartHandshaking' })

    pipe(
      webSocket,
      foldWebSocketState(
        constVoid,
        ({ sendMessage }) =>
          sendMessage({
            type: 'Handshaking',
            from: 'UI'
          }),
        constVoid
      )
    )
  }

  useEffect(() => {
    pipe(
      webSocket,
      foldWebSocketState(
        () => dispatch({ type: 'Reset' }),
        webSocket =>
          pipe(
            webSocket.response,
            option.fold(constVoid, response => {
              if (response.type === 'PeerDisconnected') {
                return dispatch({ type: 'Reset' })
              }

              if (response.type !== 'Ack') {
                return
              }

              if (
                state.type === 'Handshaking' &&
                state.receivedMessagesCount === 100
              ) {
                return dispatch({ type: 'StartOperating' })
              }

              const now = new Date()

              webSocket.sendMessage({
                type: 'Handshaking',
                from: 'UI'
              })

              dispatch({
                type: 'RegisterAck',
                ack: response,
                nextHandshakingMessageSentAt: now
              })
            })
          ),
        () => dispatch({ type: 'Reset' })
      )
    )
    // eslint-disable-next-line
  }, [webSocket])

  return (
    <NetworkContext.Provider value={{ networkState: state, startHandshaking }}>
      {props.children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  return useContext(NetworkContext)
}
