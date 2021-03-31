import { Layout } from 'antd'
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
  const { networkState, setCommand: setNetworkCommand } = useNetwork()
  const [command, setCommand] = useState<Option<Command>>(option.none)

  useEffect(() => {
    pipe(command, option.fold(constVoid, setNetworkCommand))
  }, [command, setNetworkCommand])

  return pipe(
    networkState,
    foldPartialNetworkState(
      {
        Operating: state => {
          return (
            <Layout.Content className="UI">
              <Control command={command} onChange={setCommand} />
            </Layout.Content>
          )
        }
      },
      constNull
    )
  )
}
