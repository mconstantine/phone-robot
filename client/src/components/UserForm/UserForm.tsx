import {
  Alert,
  Button,
  Form,
  Input,
  Layout,
  Result,
  Space,
  Tooltip,
  Typography
} from 'antd'
import { IO } from 'fp-ts/IO'
import { QuestionCircleFilled } from '@ant-design/icons'
import { useReducer } from 'react'
import { either, option, taskEither } from 'fp-ts'
import { constFalse, constNull, constTrue, flow, pipe } from 'fp-ts/function'
import * as loginApi from '../Login/api'
import { foldPartialApiError, suppressedApiError, usePost } from '../../useApi'
import { userFormReducer, foldUserFormState } from './UserFormState'
import { User } from './api'
import { Reader } from 'fp-ts/Reader'

interface RegisterUserProps {
  mode: 'Register'
  onSwitchMode: IO<void>
}

interface EditUserProps {
  mode: 'Edit'
  user: User
}

type Props = RegisterUserProps | EditUserProps

function foldPropsMode<T>(
  whenRegister: (props: RegisterUserProps) => T,
  whenEdit: (props: EditUserProps) => T
): Reader<Props, T> {
  return props => {
    switch (props.mode) {
      case 'Register':
        return whenRegister(props)
      case 'Edit':
        return whenEdit(props)
    }
  }
}

export function UserForm(props: Props) {
  const [state, dispatch] = useReducer(userFormReducer, {
    type: 'Idle'
  })

  const register = usePost(loginApi.register)

  const onSubmit = (data: unknown) => {
    const doRegister = pipe(
      data,
      loginApi.RegistrationInput.decode,
      either.mapLeft(() => suppressedApiError(option.none)),
      taskEither.fromEither,
      taskEither.chain(data => register(data)),
      taskEither.bimap(
        flow(
          foldPartialApiError(
            {
              CONFLICT: error => error.message
            },
            'Unable to register. Please try again'
          ),
          error => dispatch({ type: 'Error', error })
        ),
        () => dispatch({ type: 'Success' })
      )
    )

    dispatch({ type: 'Loading' })
    doRegister()
  }

  const form = (
    <Layout.Content className="Form">
      <Space direction="vertical">
        <Typography.Title>Register</Typography.Title>

        <Form onFinish={onSubmit}>
          <Form.Item
            label={
              <span>
                Username &nbsp;
                <Tooltip title="Your username is private and can be whatever you want, even your email address">
                  <QuestionCircleFilled />
                </Tooltip>
              </span>
            }
            name="username"
            rules={[{ required: true, message: 'Username is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={
              <span>
                Name &nbsp;
                <Tooltip title="This is the name other users will see">
                  <QuestionCircleFilled />
                </Tooltip>
              </span>
            }
            name="name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Password (again)"
            name="passwordConfirmation"
            rules={[
              {
                required: true,
                message: 'Password confirmation is required'
              },
              ({ getFieldValue }) => ({
                validator(_rule, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error("Passwords don't match"))
                }
              })
            ]}
            hasFeedback
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={pipe(
                state,
                foldUserFormState(constFalse, constTrue, constFalse, constFalse)
              )}
            >
              Submit
            </Button>
            {pipe(
              props,
              foldPropsMode(
                props => (
                  <Button type="link" onClick={props.onSwitchMode}>
                    Login
                  </Button>
                ),
                constNull
              )
            )}
          </Form.Item>

          {pipe(
            state,
            foldUserFormState(
              constNull,
              constNull,
              error => <Alert type="error" message={error} />,
              constNull
            )
          )}
        </Form>
      </Space>
    </Layout.Content>
  )

  return pipe(
    state,
    foldUserFormState(
      () => form,
      () => form,
      () => form,
      () =>
        pipe(
          props,
          foldPropsMode(
            props => (
              <Layout.Content>
                <Result
                  status="success"
                  title="You've been registered"
                  subTitle="Now you have to wait for one of the other users to approve you. If you know anyone, this could be a good time for texting them."
                  extra={<Button onClick={props.onSwitchMode}>Login</Button>}
                />
              </Layout.Content>
            ),
            constNull
          )
        )
    )
  )
}
