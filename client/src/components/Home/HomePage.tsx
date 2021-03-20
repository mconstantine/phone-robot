import { Button, Layout, Result, Timeline } from 'antd'
import { option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { useEffect, useReducer } from 'react'
import { foldAccount, useAccount } from '../../contexts/Account/Account'
import { useWebSocket } from '../../contexts/WebSocket/WebSocket'
import { foldWebSocketState } from '../../contexts/WebSocket/WebSocketState'
import { foldRefusalReason } from './domain'
import {
  foldHomePageState,
  homePageReducer,
  HomePageState
} from './HomePageState'

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
        // state,
        // foldHomePageState(
        //   () => <HandshakeTimeline state={state} />,
        //   () => (
        //     <Result
        //       status="error"
        //       title="Failed to connect to server"
        //       subTitle="If you know how to do it, start the server, then try reloading the page"
        //     />
        //   ),
        //   () => <HandshakeTimeline state={state} />,
        //   () => <HandshakeTimeline state={state} />
        //   // response =>
        //   //   pipe(
        //   //     response.reason,
        //   //     foldRefusalReason(
        //   //       () => (
        //   //         <Result
        //   //           status="error"
        //   //           title="Connection refused"
        //   //           subTitle={response.message}
        //   //         />
        //   //       ),
        //   //       () => (
        //   //         <Result
        //   //           status="error"
        //   //           title="Invalid credentials"
        //   //           subTitle={response.message}
        //   //           extra={[
        //   //             <Button
        //   //               onClick={() =>
        //   //                 dispatchAccountAction({ type: 'Logout' })
        //   //               }
        //   //             >
        //   //               Logout
        //   //             </Button>
        //   //           ]}
        //   //         />
        //   //       )
        //   //     )
        //   //   )
        // )
      )}
    </Layout.Content>
  )
}

interface HandshakeTimelineProps {
  state: HomePageState
}

function HandshakeTimeline(props: HandshakeTimelineProps) {
  const steps = ['Authorizing', 'Waiting for robot', 'Establishing connection']
  const { dispatchAccountAction } = useAccount()

  const createTimeline = (currentStep: number) => (
    <Timeline pending={steps[currentStep]}>
      {new Array(currentStep).fill(null).map((_, index) => (
        <Timeline.Item key={index}>{steps[index]}</Timeline.Item>
      ))}
    </Timeline>
  )

  return pipe(
    props.state,
    foldHomePageState(
      () => createTimeline(0),
      () => createTimeline(1),
      () => createTimeline(2),
      response =>
        pipe(
          response.reason,
          foldRefusalReason(
            () => (
              <Result
                status="error"
                title="Connection refused"
                subTitle={response.message}
              />
            ),
            () => (
              <Result
                status="error"
                title="Invalid credentials"
                subTitle={response.message}
                extra={[
                  <Button
                    onClick={() => dispatchAccountAction({ type: 'Logout' })}
                  >
                    Logout
                  </Button>
                ]}
              />
            )
          )
        )
    )
  )
}
