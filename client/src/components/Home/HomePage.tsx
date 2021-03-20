import { Layout, Result } from 'antd'
import { option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { useEffect, useReducer } from 'react'
import { foldAccount, useAccount } from '../../contexts/Account/Account'
import { useWebSocket } from '../../contexts/WebSocket/WebSocket'
import { foldWebSocketState } from '../../contexts/WebSocket/WebSocketState'
import { homePageReducer } from './HomePageState'
import { HandshakeTimeline } from './HandshakeTimeline'

export default function HomePage() {
  const { account } = useAccount()
  const [state, dispatch] = useReducer(homePageReducer, { type: 'Initial' })
  const webSocket = useWebSocket()

  useEffect(() => {
    pipe(
      webSocket,
      foldWebSocketState(
        constVoid,
        webSocket =>
          pipe(
            webSocket.response,
            option.fold(
              () =>
                pipe(
                  account,
                  foldAccount(constVoid, account =>
                    webSocket.sendMessage({
                      type: 'Authorization',
                      from: 'UI',
                      accessToken: account.accessToken
                    })
                  )
                ),
              dispatch
            )
          ),
        constVoid
      )
    )
  }, [webSocket, account])

  return (
    <Layout.Content>
      {pipe(
        webSocket,
        foldWebSocketState(
          () => <HandshakeTimeline state={state} />,
          () => <HandshakeTimeline state={state} />,
          () => (
            <Result
              status="error"
              title="Failed to connect to server"
              subTitle="If you know how to do it, start the server, then try reloading the page"
            />
          )
        )
      )}
    </Layout.Content>
  )
}
