import { Button, Layout, List, message, Popconfirm, Result } from 'antd'
import { nonEmptyArray, option, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { useState } from 'react'
import { foldRemoteData, useGet, usePatch } from '../../useApi'
import { User } from '../Profile/api'
import { SpinBlock } from '../SpinBlock/SpinBlock'
import * as api from './api'

export default function UsersPage() {
  const [unapprovedUsers, refresh] = useGet(api.getUnapprovedUsers)

  return pipe(
    unapprovedUsers,
    foldRemoteData(
      () => <SpinBlock />,
      () => <Result status="error" title="Unable to fetch unapproved users" />,
      flow(
        nonEmptyArray.fromArray,
        option.fold(
          () => (
            <Result status="success" title="All users have been approved" />
          ),
          users => (
            <Layout.Content>
              <List
                dataSource={users}
                renderItem={user => (
                  <List.Item
                    actions={[
                      <ApproveButton user={user} onApproved={refresh} />
                    ]}
                  >
                    <List.Item.Meta title={user.name} />
                  </List.Item>
                )}
              />
            </Layout.Content>
          )
        )
      )
    )
  )
}

interface ApproveButtonProps {
  user: User
  onApproved: IO<void>
}

function ApproveButton(props: ApproveButtonProps) {
  const approveUser = usePatch(api.approveUser(props.user.id))
  const [isLoading, setIsLoading] = useState(false)

  const onApproveUser = () => {
    const doApproveUser = pipe(
      approveUser({
        approved: true
      }),
      taskEither.bimap(
        () => {
          setIsLoading(false)
          message.error(
            `Unable to approve ${props.user.name}. Please try again`
          )
        },
        () => {
          setIsLoading(false)
          props.onApproved()
        }
      )
    )

    setIsLoading(true)
    doApproveUser()
  }

  return (
    <Popconfirm
      title={`Are you sure you want to approve ${props.user.name})`}
      okText="Yes"
      cancelText="No"
      onConfirm={onApproveUser}
    >
      <Button loading={isLoading}>Approve</Button>
    </Popconfirm>
  )
}
