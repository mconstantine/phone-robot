import { constVoid, pipe } from 'fp-ts/function'
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
  useRef
} from 'react'
import { foldNetworkState, networkReducer, NetworkState } from './NetworkState'
import { useWebSocket } from '../WebSocket/WebSocket'
import { foldWebSocketState } from '../WebSocket/WebSocketState'
import { foldAccount, useAccount } from '../Account/Account'
import { Command, foldPartialResponse } from '../../globalDomain'
import { Reader } from 'fp-ts/Reader'
import { option } from 'fp-ts'
import { useDebounceCommand } from '../../effects/useDebounceCommand'

const MESSAGES_INTERVAL = 100

interface NetworkContext {
  networkState: NetworkState
  setCommand: Reader<Command, void>
}

const NetworkContext = createContext<NetworkContext>({
  networkState: {
    type: 'Connecting'
  },
  setCommand: constVoid
})

export function NetworkProvider(props: PropsWithChildren<{}>) {
  const { webSocketState, sendMessage } = useWebSocket()
  const { account } = useAccount()
  const [state, dispatch] = useReducer(networkReducer, { type: 'Connecting' })
  const handshakingStartTime = useRef<Date>(new Date())

  const setCommand = useDebounceCommand((command: Command) => {
    sendMessage({
      type: 'Command',
      from: 'UI',
      command,
      time: Date.now()
    })
  }, MESSAGES_INTERVAL)

  useEffect(() => {
    pipe(
      webSocketState,
      foldWebSocketState({
        Initial: constVoid,
        Open: ({ response }) =>
          pipe(
            state,
            foldNetworkState({
              Connecting: () => {
                dispatch({ type: 'Connected' })

                pipe(
                  account,
                  foldAccount(constVoid, ({ accessToken }) =>
                    sendMessage({
                      type: 'Authorization',
                      from: 'UI',
                      accessToken
                    })
                  )
                )
              },
              Authorizing: () =>
                pipe(
                  response,
                  option.fold(
                    constVoid,
                    foldPartialResponse(
                      {
                        Authorized: () => dispatch({ type: 'Authorized' })
                      },
                      constVoid
                    )
                  )
                ),
              WaitingForPeer: () =>
                pipe(
                  response,
                  option.fold(
                    constVoid,
                    foldPartialResponse(
                      {
                        PeerConnected: () => {
                          handshakingStartTime.current = new Date()
                          dispatch({ type: 'PeerConnected' })
                        }
                      },
                      constVoid
                    )
                  )
                ),
              Handshaking: state => {
                pipe(
                  response,
                  option.fold(
                    constVoid,
                    foldPartialResponse(
                      {
                        PeerDisconnected: () =>
                          dispatch({ type: 'PeerDisconnected' })
                      },
                      constVoid
                    )
                  )
                )

                if (state.sentMessagesCount >= 100) {
                  dispatch({ type: 'StartOperating' })
                } else {
                  window.setTimeout(() => {
                    sendMessage({
                      type: 'Handshaking',
                      from: 'UI',
                      time: Date.now() - handshakingStartTime.current.getTime()
                    })

                    dispatch({ type: 'RegisterHandshakeSent' })
                  }, MESSAGES_INTERVAL)
                }
              },
              Operating: () => {
                pipe(
                  response,
                  option.fold(
                    constVoid,
                    foldPartialResponse(
                      {
                        PeerDisconnected: () =>
                          dispatch({ type: 'PeerDisconnected' })
                      },
                      constVoid
                    )
                  )
                )
              },
              Error: constVoid
            })
          ),
        Closed: () => {
          if (state.type !== 'Connecting') {
            dispatch({ type: 'Reset' })
          }
        },
        ConnectionFailed: () => {
          if (state.type !== 'Connecting') {
            dispatch({ type: 'Reset' })
          }
        }
      })
    )
  })

  return (
    <NetworkContext.Provider value={{ networkState: state, setCommand }}>
      {props.children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  return useContext(NetworkContext)
}
