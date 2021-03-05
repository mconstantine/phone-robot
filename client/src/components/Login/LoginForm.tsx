import { IO } from 'fp-ts/IO'
import { Alert, Button, Form, Input, Layout, Space, Typography } from 'antd'
import { either, option, taskEither } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { useState } from 'react'
import { foldPartialApiError, suppressedApiError, usePost } from '../../useApi'
import { useAccount } from '../../contexts/Account/Account'
import * as api from './api'
import { Option } from 'fp-ts/Option'

interface Props {
  onSwitchMode: IO<void>
}

export function LoginForm(props: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Option<string>>(option.none)
  const { dispatchAccountAction } = useAccount()
  const login = usePost(api.login)

  const onSubmit = (data: unknown) => {
    const doLogin = pipe(
      data,
      api.LoginInput.decode,
      either.mapLeft(() => suppressedApiError(option.none)),
      taskEither.fromEither,
      taskEither.chain(data => login(data)),
      taskEither.bimap(
        error => {
          setIsSubmitting(false)

          pipe(
            error,
            foldPartialApiError(
              {
                NOT_FOUND: error => error.message,
                FORBIDDEN: error => error.message
              },
              'Unable to login. Please try again'
            ),
            option.some,
            setError
          )
        },
        sessionData => {
          setIsSubmitting(false)
          dispatchAccountAction({
            type: 'Login',
            ...sessionData
          })
        }
      )
    )

    setError(option.none)
    setIsSubmitting(true)
    doLogin()
  }

  return (
    <Layout.Content className="Form">
      <Space direction="vertical">
        <Typography.Title>Login</Typography.Title>

        <Form onFinish={onSubmit}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Username is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              Submit
            </Button>
            <Button type="link" onClick={props.onSwitchMode}>
              Register
            </Button>
          </Form.Item>

          {pipe(
            error,
            option.fold(constNull, error => (
              <Alert type="error" message={error} />
            ))
          )}
        </Form>
      </Space>
    </Layout.Content>
  )
}
