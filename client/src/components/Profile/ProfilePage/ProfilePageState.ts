import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'

interface IdleState {
  type: 'Idle'
}

type LoadingType = 'Deletion' | 'Submission'
interface LoadingState {
  type: 'Loading'
  loading: LoadingType
}

interface ErrorState {
  type: 'Error'
  error: string
}

type State = IdleState | LoadingState | ErrorState

export function foldProfilePageState<T>(
  whenIdle: IO<T>,
  whenLoading: Reader<LoadingType, T>,
  whenError: Reader<string, T>
): Reader<State, T> {
  return state => {
    switch (state.type) {
      case 'Idle':
        return whenIdle()
      case 'Loading':
        return whenLoading(state.loading)
      case 'Error':
        return whenError(state.error)
    }
  }
}

export function foldLoadingType<T>(
  whenDeletion: IO<T>,
  whenSubmission: IO<T>
): Reader<LoadingType, T> {
  return loadingType => {
    switch (loadingType) {
      case 'Deletion':
        return whenDeletion()
      case 'Submission':
        return whenSubmission()
    }
  }
}

interface LoadingAction {
  type: 'Loading'
  loading: LoadingType
}

interface ErrorAction {
  type: 'Error'
  error: string
}

interface SuccessAction {
  type: 'Success'
}

type Action = LoadingAction | ErrorAction | SuccessAction

export function profilePageReducer(state: State, action: Action): State {
  switch (state.type) {
    case 'Idle':
      switch (action.type) {
        case 'Loading':
          return {
            type: 'Loading',
            loading: action.loading
          }
        case 'Error':
          return state
        case 'Success':
          return state
      }
    case 'Loading':
      switch (action.type) {
        case 'Loading':
          return state
        case 'Error':
          return {
            type: 'Error',
            error: action.error
          }
        case 'Success':
          return {
            type: 'Idle'
          }
      }
    case 'Error':
      switch (action.type) {
        case 'Loading':
          return {
            type: 'Loading',
            loading: action.loading
          }
        case 'Error':
          return state
        case 'Success':
          return state
      }
  }
}
