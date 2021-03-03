import { Router } from 'express'
import { registerRoute } from './register'

export function userRouter(): Router {
  return Router().post('/register', registerRoute)
}
