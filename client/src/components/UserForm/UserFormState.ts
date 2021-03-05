interface IdleState {
  type: 'Idle'
}

interface ErrorState {
  type: 'Error'
  error: string
}

interface LoadingState {
  type: 'Loading'
}

interface SuccessState {
  type: 'Success'
}

type UserFormState = IdleState | ErrorState | LoadingState | SuccessState

export function foldUserFormState<T>(
  whenIdle: (state: IdleState) => T,
  whenLoading: (state: LoadingState) => T,
  whenError: (state: ErrorState) => T,
  whenSuccess: (state: SuccessState) => T
): (state: UserFormState) => T {
  return state => {
    switch (state.type) {
      case 'Idle':
        return whenIdle(state)
      case 'Loading':
        return whenLoading(state)
      case 'Error':
        return whenError(state)
      case 'Success':
        return whenSuccess(state)
    }
  }
}

interface LoadingAction {
  type: 'Loading'
}

interface ErrorAction {
  type: 'Error'
  error: string
}

interface SuccessAction {
  type: 'Success'
}

type UserFormAction = LoadingAction | ErrorAction | SuccessAction

export function userFormReducer(
  state: UserFormState,
  action: UserFormAction
): UserFormState {
  switch (state.type) {
    case 'Idle':
      switch (action.type) {
        case 'Loading':
          return {
            type: 'Loading'
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
            type: 'Success'
          }
      }
    case 'Error':
      switch (action.type) {
        case 'Loading':
          return {
            type: 'Loading'
          }
        case 'Error':
          return state
        case 'Success':
          return state
      }
    case 'Success':
      return state
  }
}
