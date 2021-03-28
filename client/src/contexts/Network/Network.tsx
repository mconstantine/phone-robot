import { constVoid, pipe } from 'fp-ts/function'
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useReducer
} from 'react'
import { foldNetworkState, networkReducer, NetworkState } from './NetworkState'
import { useWebSocket } from '../WebSocket/WebSocket'
import { foldWebSocketState } from '../WebSocket/WebSocketState'
import { foldAccount, useAccount } from '../Account/Account'
import { Command, foldPartialResponse } from '../../globalDomain'
import { Reader } from 'fp-ts/Reader'
import { option } from 'fp-ts'
import { Option } from 'fp-ts/Option'

interface NetworkContext {
  networkState: NetworkState
  setCommand: Reader<Option<Command>, void>
}

const NetworkContext = createContext<NetworkContext>({
  networkState: {
    type: 'Connecting'
  },
  setCommand: constVoid
})

export function NetworkProvider(props: PropsWithChildren<{}>) {
  const { webSocketState, sendMessage, clearResponse } = useWebSocket()
  const { account } = useAccount()
  const [state, dispatch] = useReducer(networkReducer, { type: 'Connecting' })

  const setCommand = useCallback((command: Option<Command>) => {
    dispatch({
      type: 'RegisterCommand',
      command
    })
  }, [])

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
                        PeerConnected: () => dispatch({ type: 'PeerConnected' })
                      },
                      constVoid
                    )
                  )
                ),
              Handshaking: state => {
                if (state.isAwaitingForAck) {
                  pipe(
                    response,
                    option.fold(
                      constVoid,
                      foldPartialResponse(
                        {
                          PeerDisconnected: () =>
                            dispatch({ type: 'PeerDisconnected' }),
                          Ack: ack => dispatch({ type: 'RegisterAck', ack })
                        },
                        constVoid
                      )
                    )
                  )
                } else {
                  clearResponse()

                  if (state.receivedMessagesCount < 100) {
                    dispatch({ type: 'RegisterHandshakeSent' })

                    sendMessage({
                      type: 'Handshaking',
                      from: 'UI'
                    })
                  } else {
                    dispatch({ type: 'StartOperating' })
                  }
                }
              },
              Operating: state => {
                if (state.isAwaitingForAck) {
                  pipe(
                    response,
                    option.fold(
                      constVoid,
                      foldPartialResponse(
                        {
                          PeerDisconnected: () =>
                            dispatch({ type: 'PeerDisconnected' }),
                          Ack: ack => dispatch({ type: 'RegisterAck', ack })
                        },
                        constVoid
                      )
                    )
                  )
                } else {
                  pipe(
                    state.command,
                    option.fold(
                      () =>
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
                        ),
                      command => {
                        clearResponse()
                        dispatch({ type: 'RegisterCommandSent' })
                        sendMessage({
                          type: 'Command',
                          from: 'UI',
                          command
                        })
                      }
                    )
                  )
                }
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
