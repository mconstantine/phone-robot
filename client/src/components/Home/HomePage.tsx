import { Layout, Result, Timeline } from 'antd'
import { either } from 'fp-ts'
import { constNull, constVoid, pipe } from 'fp-ts/function'
import { useEffect, useReducer } from 'react'
import { foldAccount, useAccount } from '../../contexts/Account/Account'
import { Message, Response } from './domain'
import {
  foldHomePageState,
  homePageReducer,
  HomePageState
} from './HomePageState'

export default function HomePage() {
  const { account } = useAccount()
  const [state, dispatch] = useReducer(homePageReducer, { type: 'Initial' })

  useEffect(() => {
    const connection = new WebSocket(process.env.REACT_APP_WS_URL!)

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
        either.fold(constVoid, dispatch)
      )

    return () => connection.close()
  }, [account])

  return (
    <Layout.Content>
      {pipe(
        state,
        foldHomePageState(
          () => <HandshakeTimeline state={state} />,
          () => <HandshakeTimeline state={state} />,
          () => <HandshakeTimeline state={state} />,
          ({ reason }) => (
            <Result
              status="error"
              title="Connection refused"
              subTitle={reason}
            />
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
      () => createTimeline(1),
      () => createTimeline(2),
      constNull
    )
  )
}

function sendMessage(connection: WebSocket, message: Message) {
  connection.send(pipe(message, Message.encode, JSON.stringify))
}
