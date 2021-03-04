import { Router } from 'express'
import { deleteRoute } from './deleteUser'
import { listUnapprovedRoute } from './listUnapprovedUsers'
import { loginRoute } from './loginUser'
import { refreshTokenRoute } from './refreshToken'
import { registerRoute } from './registerUser'
import { updateRoute } from './updateUser'
import { profileRoute } from './userProfile'

export function userRouter(): Router {
  return Router()
    .post('/register', registerRoute)
    .post('/login', loginRoute)
    .post('/refreshToken', refreshTokenRoute)
    .get('/me', profileRoute)
    .patch('/:id', updateRoute)
    .delete('/:id', deleteRoute)
    .get('/unapproved', listUnapprovedRoute)
}
