import { Router } from 'express'
import { deleteRoute } from './deleteUser'
import { listUnapprovedRoute } from './listUnapprovedUsers'
import { loginRoute } from './loginUser'
import { registerRoute } from './registerUser'
import { updateRoute } from './updateUser'
import { profileRoute } from './userProfile'

export function userRouter(): Router {
  return Router()
    .post('/register', registerRoute)
    .post('/login', loginRoute)
    .get('/me', profileRoute)
    .patch('/:id', updateRoute)
    .delete('/:id', deleteRoute)
    .get('/unapproved', listUnapprovedRoute)
}
