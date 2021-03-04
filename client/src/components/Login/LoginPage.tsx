import { Alert, Button, Form, Input, Layout } from 'antd'
import { option, taskEither } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { useState } from 'react'
import { foldPartialApiError, usePost } from '../../useApi'
import { useAccount } from '../../contexts/Account'
import * as api from './api'
import { Option } from 'fp-ts/Option'

interface LoginFormData {
  username: NonEmptyString
  password: NonEmptyString
}

export function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Option<string>>(option.none)
  const { dispatchAccountAction } = useAccount()
  const login = usePost(api.login)

  const onSubmit = (data: LoginFormData) => {
    const doLogin = pipe(
      login(data),
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
    <Layout.Content>
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
        </Form.Item>

        {pipe(
          error,
          option.fold(constNull, error => (
            <Alert type="error" message={error} />
          ))
        )}
      </Form>
    </Layout.Content>
  )
}
