import { Router } from 'express'
import { loginRoute } from './loginUser'
import { registerRoute } from './registerUser'

export function userRouter(): Router {
  return Router().post('/register', registerRoute).post('/login', loginRoute)
}
