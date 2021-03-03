import { Router } from 'express'
import { loginRoute } from './login'
import { registerRoute } from './register'

export function userRouter(): Router {
  return Router().post('/register', registerRoute).post('/login', loginRoute)
}
