import { apiCall } from '../../useApi'
import * as t from 'io-ts'
import { User } from '../Profile/api'
import { PositiveInteger } from '../../globalDomain'

export const getUnapprovedUsers = apiCall(
  '/users/unapproved',
  t.array(User, 'UnapprovedUsers')
)

const ApprovedUser = t.type(
  {
    approved: t.literal(true)
  },
  'ApprovedUser'
)

export const approveUser = (userId: PositiveInteger) =>
  apiCall(`/users/${userId}`, User, ApprovedUser)
