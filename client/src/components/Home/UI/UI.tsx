import { Layout, Typography } from 'antd'
import { option } from 'fp-ts'
import { constNull, constVoid, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { useEffect, useState } from 'react'
import { useNetwork } from '../../../contexts/Network/Network'
import { foldPartialNetworkState } from '../../../contexts/Network/NetworkState'
import { Control } from './Control'
import './UI.less'
import { Command } from '../../../globalDomain'

export function UI() {
  const network = useNetwork()
  const [command, setCommand] = useState<Option<Command>>(option.none)

  useEffect(() => {
    // TODO: send this to robot
    pipe(command, option.fold(constVoid, console.log))
  }, [command])

  return pipe(
    network,
    foldPartialNetworkState(
      {
        Operating: state => {
          const avgRTT = (state.minRTT + state.maxRTT) / 2

          const averageRTTLabel = `Average RTT: ${(avgRTT / 1000).toFixed(
            3
          )} seconds`

          return (
            <Layout.Content className="UI">
              <div className="averageRTT">
                <Typography.Text type="secondary">
                  {averageRTTLabel}
                </Typography.Text>
              </div>
              <Control command={command} onChange={setCommand} />
            </Layout.Content>
          )
        }
      },
      constNull
    )
  )
}
