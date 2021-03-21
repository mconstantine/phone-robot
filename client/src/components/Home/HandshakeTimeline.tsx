import { Button, Result, Timeline } from 'antd'
import { pipe } from 'fp-ts/function'
import { useEffect } from 'react'
import { useAccount } from '../../contexts/Account/Account'
import { useNetwork } from '../../contexts/Network/Network'
import { foldNetworkState } from '../../contexts/Network/NetworkState'
import { foldRefusalReason } from './domain'
import { foldHomePageState, HomePageState } from './HomePageState'

interface Props {
  state: HomePageState
}

export function HandshakeTimeline(props: Props) {
  const { dispatchAccountAction } = useAccount()
  const { networkState, startHandshaking } = useNetwork()

  const steps = [
    'Authorizing',
    'Waiting for robot',
    'Establishing connection' +
      pipe(
        networkState,
        foldNetworkState(
          () => '',
          state => {
            const rtt = (state.averageRTT / 1000).toFixed(3)
            return ` (${state.receivedMessagesCount}%), average RTT: ${rtt} seconds`
          },
          () => ''
        )
      )
  ]

  const createTimeline = (currentStep: number) => (
    <Timeline pending={steps[currentStep]}>
      {new Array(currentStep).fill(null).map((_, index) => (
        <Timeline.Item key={index}>{steps[index]}</Timeline.Item>
      ))}
    </Timeline>
  )

  useEffect(() => {
    if (props.state.type === 'Handshaking' && networkState.type === 'Initial') {
      startHandshaking()
    }
  }, [props.state, networkState, startHandshaking])

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
