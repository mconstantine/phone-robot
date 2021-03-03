import { Router } from 'express'
import { loginRoute } from './loginUser'
import { registerRoute } from './registerUser'
import { updateRoute } from './updateUser'

export function userRouter(): Router {
  return Router()
    .post('/register', registerRoute)
    .post('/login', loginRoute)
    .patch('/:id', updateRoute)
}
