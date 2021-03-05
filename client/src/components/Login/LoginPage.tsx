import { pipe } from 'fp-ts/function'
import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { UserForm } from '../UserForm/UserForm'

type Mode = 'Register' | 'Login'

function foldMode<T>(
  whenRegister: () => T,
  whenLogin: () => T
): (mode: Mode) => T {
  return mode => {
    switch (mode) {
      case 'Register':
        return whenRegister()
      case 'Login':
        return whenLogin()
    }
  }
}

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('Login')

  return pipe(
    mode,
    foldMode(
      () => <UserForm mode="Register" onSwitchMode={() => setMode('Login')} />,
      () => <LoginForm onSwitchMode={() => setMode('Register')} />
    )
  )
}
