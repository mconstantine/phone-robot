import { Button, Layout, Result, Timeline } from 'antd'
import { either } from 'fp-ts'
import { constNull, constVoid, pipe } from 'fp-ts/function'
import { useCallback, useEffect, useReducer } from 'react'
import { w3cwebsocket } from 'websocket'
import { foldAccount, useAccount } from '../../contexts/Account/Account'
import { Message, Response } from './domain'
import {
  foldHomePageState,
  homePageReducer,
  HomePageState
} from './HomePageState'

const client = new w3cwebsocket(process.env.REACT_APP_WS_URL!)

export default function HomePage() {
  const { account } = useAccount()
  const [state, dispatch] = useReducer(homePageReducer, { type: 'Initial' })

  const authorize = useCallback(
    () =>
      pipe(
        account,
        foldAccount(
          // Will never happen, `LoginPage` is displayed when the account is anonymous
          constVoid,
          ({ accessToken }) =>
            sendMessage({
              type: 'Authorization',
              from: 'UI',
              accessToken
            })
        )
      ),
    [account]
  )

  useEffect(() => {
    client.onopen = authorize

    if (client.readyState === client.OPEN) {
      authorize()
    }

    return () => {
      sendMessage({
        type: 'Reset',
        from: 'UI'
      })
    }
  }, [authorize])

  useEffect(() => {
    client.onmessage = message => {
      pipe(
        message.data,
        data => either.tryCatch(() => JSON.parse(data.toString()), constVoid),
        either.chainW(Response.decode),
        either.fold(constVoid, dispatch)
      )
    }
  }, [])

  useEffect(() => {
    pipe(
      state,
      foldHomePageState(
        constVoid,
        () => console.log('TODO: wait for robot'),
        constVoid
      )
    )
  }, [state])

  return (
    <Layout.Content>
      {pipe(
        state,
        foldHomePageState(
          () => <HandshakeTimeline state={state} />,
          () => <HandshakeTimeline state={state} />,
          ({ reason }) => (
            <Result
              status="error"
              title="Connection refused"
              subTitle={reason}
              extra={<Button onClick={authorize}>Retry</Button>}
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
  const steps = ['Authorizing', 'Waiting for robot']

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
      constNull
    )
  )
}

function sendMessage(message: Message) {
  client.send(JSON.stringify(message))
}
