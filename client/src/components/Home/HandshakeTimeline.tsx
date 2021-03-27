import { Timeline } from 'antd'
import { constNull, pipe } from 'fp-ts/function'
import { useNetwork } from '../../contexts/Network/Network'
import { foldNetworkState } from '../../contexts/Network/NetworkState'

export function HandshakeTimeline() {
  const network = useNetwork()

  const step1 = () => 'Connecting'
  const step2 = () => 'Authorizing'
  const step3 = () => 'Waiting for robot'

  const step4 = () => {
    if (network.type === 'Handshaking') {
      const avgRTT = (network.minRTT + network.maxRTT) / 2
      const rtt = (avgRTT / 1000).toFixed(3)

      return `Establishing connection (${network.receivedMessagesCount}%), average RTT: ${rtt} seconds`
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
    network,
    foldNetworkState({
      Connecting: () => createTimeline(0),
      Authorizing: () => createTimeline(1),
      WaitingForPeer: () => createTimeline(2),
      Handshaking: () => createTimeline(3),
      Operating: constNull,
      Error: constNull
    })
  )
}
