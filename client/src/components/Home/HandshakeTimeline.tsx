import { Timeline } from 'antd'
import { constNull, pipe } from 'fp-ts/function'
import { useNetwork } from '../../contexts/Network/Network'
import { foldPartialNetworkState } from '../../contexts/Network/NetworkState'

export function HandshakeTimeline() {
  const { networkState } = useNetwork()

  const step1 = () => 'Connecting'
  const step2 = () => 'Authorizing'
  const step3 = () => 'Waiting for robot'

  const step4 = () => {
    if (networkState.type === 'Handshaking') {
      return `Establishing connection (${networkState.sentMessagesCount}%)`
    } else {
      return 'Establishing connection'
    }
  }

  const steps = [step1(), step2(), step3(), step4()]

  const createTimeline = (currentStep: number) => (
    <Timeline pending={steps[currentStep]}>
      {new Array(currentStep).fill(null).map((_, index) => (
        <Timeline.Item key={index}>{steps[index]}</Timeline.Item>
      ))}
    </Timeline>
  )

  return pipe(
    networkState,
    foldPartialNetworkState(
      {
        Connecting: () => createTimeline(0),
        Authorizing: () => createTimeline(1),
        WaitingForPeer: () => createTimeline(2),
        Handshaking: () => createTimeline(3)
      },
      constNull
    )
  )
}
