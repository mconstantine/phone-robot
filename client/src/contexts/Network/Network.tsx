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
import { foldAccount, useAccount } from '../Account/Account'
import { foldResponse } from '../../components/Home/domain'

const NetworkContext = createContext<NetworkState>({
  type: 'Connecting'
})

export function NetworkProvider(props: PropsWithChildren<{}>) {
  const webSocket = useWebSocket()
  const [state, dispatch] = useReducer(networkReducer, { type: 'Connecting' })
  const { account } = useAccount()

  useEffect(() => {
    pipe(
      webSocket,
      foldWebSocketState(
        () => dispatch({ type: 'Reset' }),
        webSocket => {
          dispatch({ type: 'Connected' })

          pipe(
            webSocket.response,
            option.fold(
              () =>
                pipe(
                  account,
                  foldAccount(
                    () => dispatch({ type: 'Reset' }),
                    account =>
                      webSocket.sendMessage({
                        type: 'Authorization',
                        from: 'UI',
                        accessToken: account.accessToken
                      })
                  )
                ),
              foldResponse({
                Authorized: () => {
                  dispatch({ type: 'Authorized' })
                },
                Refused: response =>
                  dispatch({
                    type: 'Error',
                    reason: response.reason,
                    message: response.message
                  }),
                PeerConnected: () => {
                  dispatch({ type: 'PeerConnected' })

                  webSocket.sendMessage({
                    type: 'Handshaking',
                    from: 'UI'
                  })
                },
                PeerDisconnected: () => dispatch({ type: 'PeerDisconnected' }),
                Ack: response => {
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
                }
              })
            )
          )
        },
        () => dispatch({ type: 'Reset' })
      )
    )
    // eslint-disable-next-line
  }, [account, webSocket])

  return (
    <NetworkContext.Provider value={state}>
      {props.children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  return useContext(NetworkContext)
}
