'use server'

import { 
  getUsers as _getUsers, 
  suspendUser as _suspendUser, 
  banUser as _banUser, 
  deleteUser as _deleteUser, 
  unsuspendUser as _unsuspendUser, 
  unbanUser as _unbanUser 
} from '../actions'

export async function getUsers(params: Parameters<typeof _getUsers>[0]) {
  return await _getUsers(params)
}

export async function suspendUser(userId: string, reason: string, durationDays?: number) {
  return await _suspendUser(userId, reason, durationDays)
}

export async function banUser(userId: string, reason: string, durationDays?: number) {
  return await _banUser(userId, reason, durationDays)
}

export async function deleteUser(userId: string) {
  return await _deleteUser(userId)
}

export async function unsuspendUser(userId: string) {
  return await _unsuspendUser(userId)
}

export async function unbanUser(userId: string) {
  return await _unbanUser(userId)
}
