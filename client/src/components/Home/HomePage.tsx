import { Button, Layout, Result, Timeline } from 'antd'
import { either } from 'fp-ts'
import { constNull, constVoid, pipe } from 'fp-ts/function'
import { useEffect, useReducer } from 'react'
import { foldAccount, useAccount } from '../../contexts/Account/Account'
import { refreshToken } from '../../useApi'
import { foldRefusalReason, Message, Response } from './domain'
import {
  foldHomePageState,
  homePageReducer,
  HomePageState
} from './HomePageState'

export default function HomePage() {
  const { account, dispatchAccountAction } = useAccount()
  const [state, dispatch] = useReducer(homePageReducer, { type: 'Initial' })

  useEffect(() => {
    const connection = new WebSocket(process.env.REACT_APP_WS_URL!)

    connection.onerror = () =>
      dispatch({
        type: 'WebSocketConnectionError'
      })

    connection.onopen = () =>
      pipe(
        account,
        foldAccount(constVoid, account =>
          sendMessage(connection, {
            type: 'Authorization',
            from: 'UI',
            accessToken: account.accessToken
          })
        )
      )

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
            dispatch(response)
          }
        })
      )

    return () => connection.close()
  }, [account, dispatchAccountAction])

  return (
    <Layout.Content>
      {pipe(
        state,
        foldHomePageState(
          () => <HandshakeTimeline state={state} />,
          () => (
            <Result
              status="error"
              title="Failed to connect to server"
              subTitle="If you know how to do it, start the server, then try reloading the page"
            />
          ),
          () => <HandshakeTimeline state={state} />,
          () => <HandshakeTimeline state={state} />,
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
                        onClick={() =>
                          dispatchAccountAction({ type: 'Logout' })
                        }
                      >
                        Logout
                      </Button>
                    ]}
                  />
                )
              )
            )
        )
      )}
    </Layout.Content>
  )
}

interface HandshakeTimelineProps {
  state: HomePageState
}

function HandshakeTimeline(props: HandshakeTimelineProps) {
  const steps = ['Authorizing', 'Waiting for robot', 'Establishing connection']

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
      constNull,
      () => createTimeline(1),
      () => createTimeline(2),
      constNull
    )
  )
}

function sendMessage(connection: WebSocket, message: Message) {
  connection.send(pipe(message, Message.encode, JSON.stringify))
}
