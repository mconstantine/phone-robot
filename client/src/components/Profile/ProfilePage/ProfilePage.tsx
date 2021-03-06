import {
  Button,
  Form,
  Input,
  Layout,
  Popconfirm,
  Result,
  Space,
  Typography
} from 'antd'
import { boolean, either, record, taskEither } from 'fp-ts'
import { constFalse, constTrue, constVoid, flow, pipe } from 'fp-ts/function'
import { useReducer, useState } from 'react'
import { useAccount } from '../../../contexts/Account/Account'
import {
  foldPartialApiError,
  foldRemoteData,
  useDelete,
  useGet,
  usePatch
} from '../../../useApi'
import { SpinBlock } from '../../SpinBlock/SpinBlock'
import * as api from '../api'
import {
  foldLoadingType,
  foldProfilePageState,
  profilePageReducer
} from './ProfilePageState'

export default function ProfilePage() {
  const [profile] = useGet(api.getProfile)

  return pipe(
    profile,
    foldRemoteData(
      () => <SpinBlock />,
      error => (
        <Result
          status="error"
          title="Unable to get your profile data"
          subTitle={error.message}
        />
      ),
      user => <EditUserForm user={user} />
    )
  )
}

interface Props {
  user: api.User
}

function EditUserForm(props: Props) {
  const [isEditingPassword, setIsEditingPassword] = useState(false)

  const [state, dispatch] = useReducer(profilePageReducer, {
    type: 'Idle'
  })

  const { dispatchAccountAction } = useAccount()
  const deleteProfile = useDelete(api.deleteProfile(props.user.id))
  const updateProfile = usePatch(api.updateProfile(props.user.id))

  const onLogout = () =>
    dispatchAccountAction({
      type: 'Logout'
    })

  const onDeleteProfile = () => {
    const doDeleteProfile = pipe(
      deleteProfile(),
      taskEither.bimap(
        () =>
          dispatch({
            type: 'Error',
            error: 'Unable to delete your profile. Please try again'
          }),
        () => {
          dispatch({ type: 'Success' })
          onLogout()
        }
      )
    )

    dispatch({ type: 'Loading', loading: 'Deletion' })
    doDeleteProfile()
  }

  const onUpdateProfile = (data: unknown) => {
    pipe(
      data,
      api.UserUpdateInput.decode,
      either.fold(constVoid, data => {
        const updateData: api.UserUpdateInput = {}
        let shouldLogout = false

        if (data.name !== props.user.name) {
          updateData.name = data.name
        }

        if (data.username !== props.user.username) {
          updateData.username = data.username
          shouldLogout = true
        }

        if (isEditingPassword) {
          updateData.password = data.password
          updateData.passwordConfirmation = data.passwordConfirmation
          shouldLogout = true
        }

        if (!record.size(updateData)) {
          return
        }

        const doUpdateProfile = pipe(
          updateProfile(updateData),
          taskEither.bimap(
            flow(
              foldPartialApiError(
                {
                  CONFLICT: error => error.message
                },
                'Unable to update your profile. Please try again'
              ),
              error =>
                dispatch({
                  type: 'Error',
                  error
                })
            ),
            () => {
              dispatch({ type: 'Success' })
              shouldLogout && onLogout()
            }
          )
        )

        dispatch({ type: 'Loading', loading: 'Submission' })
        doUpdateProfile()
      })
    )
  }

  return (
    <Layout.Content className="Form">
      <Space direction="vertical" className="Form">
        <Typography.Title>{props.user.name}</Typography.Title>

        <Form initialValues={props.user} onFinish={onUpdateProfile}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Username is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input />
          </Form.Item>

          {pipe(
            isEditingPassword,
            boolean.fold(
              () => (
                <Form.Item>
                  <Typography.Link onClick={() => setIsEditingPassword(true)}>
                    Change password
                  </Typography.Link>
                </Form.Item>
              ),
              () => (
                <>
                  <Form.Item
                    label="New password"
                    name="password"
                    rules={[
                      {
                        required: true,
                        message: 'Password is required'
                      }
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                  <Form.Item
                    label="New password (again)"
                    name="passwordConfirmation"
                    rules={[
                      {
                        required: true,
                        message: 'Password confirmation is required'
                      },
                      ({ getFieldValue }) => ({
                        validator(_rule, value) {
                          const password = getFieldValue('password')
                          if (value === password) {
                            return Promise.resolve()
                          }

                          return Promise.reject(
                            new Error("Passwords don't match")
                          )
                        }
                      })
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                  <Form.Item>
                    <Typography.Link
                      onClick={() => setIsEditingPassword(false)}
                    >
                      Cancel password change
                    </Typography.Link>
                  </Form.Item>
                </>
              )
            )
          )}

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                disabled={pipe(
                  state,
                  foldProfilePageState(
                    constFalse,
                    foldLoadingType(constTrue, constFalse),
                    constFalse
                  )
                )}
                loading={pipe(
                  state,
                  foldProfilePageState(
                    constFalse,
                    foldLoadingType(constFalse, constTrue),
                    constFalse
                  )
                )}
              >
                Submit
              </Button>

              <Button
                onClick={onLogout}
                disabled={pipe(
                  state,
                  foldProfilePageState(constFalse, constTrue, constFalse)
                )}
              >
                Logout
              </Button>

              <Popconfirm
                title="Are you sure you want to delete your profile?"
                onConfirm={onDeleteProfile}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  danger
                  disabled={pipe(
                    state,
                    foldProfilePageState(
                      constFalse,
                      foldLoadingType(constFalse, constTrue),
                      constFalse
                    )
                  )}
                  loading={pipe(
                    state,
                    foldProfilePageState(
                      constFalse,
                      foldLoadingType(constTrue, constFalse),
                      constFalse
                    )
                  )}
                >
                  Delete my profile
                </Button>
              </Popconfirm>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Layout.Content>
  )
}
