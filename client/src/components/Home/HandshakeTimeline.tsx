import { Button, Result, Timeline } from 'antd'
import { pipe } from 'fp-ts/function'
import { useEffect } from 'react'
import { useAccount } from '../../contexts/Account/Account'
import { foldRefusalReason } from './domain'
import { foldHomePageState, HomePageState } from './HomePageState'

interface Props {
  state: HomePageState
}

export function HandshakeTimeline(props: Props) {
  const steps = ['Authorizing', 'Waiting for robot', 'Establishing connection']
  const { dispatchAccountAction } = useAccount()

  const createTimeline = (currentStep: number) => (
    <Timeline pending={steps[currentStep]}>
      {new Array(currentStep).fill(null).map((_, index) => (
        <Timeline.Item key={index}>{steps[index]}</Timeline.Item>
      ))}
    </Timeline>
  )

  useEffect(() => {
    if (props.state.type === 'Handshaking') {
      console.log('TODO: start handshaking')
    }
  }, [props.state])

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
