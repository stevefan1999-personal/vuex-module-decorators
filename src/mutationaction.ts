import { Action as Act, ActionContext, Module as Mod, Mutation as Mut, Payload, Store } from 'vuex'

export interface MutationActionParams {
  mutate: string[]
  throwOriginalErrorForAction?: boolean
}
export function MutationAction<T>(params: MutationActionParams) {
  return function(
    target: T,
    key: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
  ) {
    const module = target.constructor as Mod<T, any>
    if (!module.mutations) {
      module.mutations = {}
    }
    if (!module.actions) {
      module.actions = {}
    }
    const mutactFunction = descriptor.value as (() => Promise<any>)

    const action: Act<typeof target, any> = async function(
      context: ActionContext<typeof target, any>,
      payload: Payload
    ) {
      try {
        const actionPayload = await mutactFunction.call(context, payload)
        context.commit(key as string, actionPayload)
      } catch (e) {
        if (params.throwOriginalErrorForAction) {
          throw e
        } else {
          console.error('Could not perform action ' + key.toString())
          console.error(e)
        }
      }
    }

    const mutation: Mut<typeof target> = function(
      state: typeof target & Store<T>,
      payload: Payload & { [k: string]: any }
    ) {
      for (let stateItem of params.mutate) {
        if (state[stateItem] != null && payload[stateItem] != null) {
          state[stateItem] = payload[stateItem]
        } else {
          throw new Error(`ERR_MUTATE_PARAMS_NOT_IN_PAYLOAD
          In @MutationAction, mutate: ['a', 'b', ...] array keys must
          match with return type = {a: {}, b: {}, ...} and must
          also be in state.`)
        }
      }
    }
    module.actions[key as string] = action
    module.mutations[key as string] = mutation
  }
}
