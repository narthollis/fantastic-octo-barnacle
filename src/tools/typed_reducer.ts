import { useReducer, useRef, Reducer, useMemo } from "react";

export type PayloadAction<
  P = void,
  T extends string | number | symbol = string
> = {
  payload: P;
  type: T;
};

type CaseReducerAction<S> = ((state: S) => S) | ((state: S, payload: any) => S);

type CaseReducers<S> = {
  [K: string]: CaseReducerAction<S>;
};

type CaseReducerPayload<
  S,
  T extends CaseReducerAction<S>
> = Parameters<T> extends [state: S, payload: infer P] ? P : void;

type CreatedReducerActions<S, R extends CaseReducers<S>> = {
  [K in keyof R]: PayloadAction<CaseReducerPayload<S, R[K]>, K>;
};

type CreatedReducerActionCreator<S, R extends CaseReducers<S>> = {
  [K in keyof R]: (
    payload: CaseReducerPayload<S, R[K]>
  ) => PayloadAction<CaseReducerPayload<S, R[K]>, K>;
};

type CreatedReducerActionDispatch<S, R extends CaseReducers<S>> = {
  [K in keyof R]: (payload: CaseReducerPayload<S, R[K]>) => void;
};

type CreatedReducer<S, R extends CaseReducers<S>> = {
  reducer: Reducer<S, CreatedReducerActions<S, R>[keyof R]>;
  actions: CreatedReducerActionCreator<S, R>;
};

function objectMap<
  T extends Record<string, any>,
  R extends Record<keyof T, unknown>
>(
  obj: T,
  map: <K extends keyof T>(entry: [K, T[K]], index: number) => R[K]
): R {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v], i) => [k, map([k, v], i)])
  ) as R;
}

function createReducer<S, R extends CaseReducers<S>>(
  reducers: R
): CreatedReducer<S, R> {
  const actions = objectMap<R, CreatedReducerActionCreator<S, R>>(
    reducers,
    ([type, reducer]) =>
      (payload: Parameters<typeof reducer>[1]) => ({ type, payload })
  );

  return {
    reducer: (state, action) =>
      reducers[action.type]?.(state, action.payload) ?? state,
    actions,
  };
}

export function useCreateReducer<S, R extends CaseReducers<S>>(
  reducers: R,
  init: S
): [S, CreatedReducerActionDispatch<S, R>] {
  const ref = useRef<CreatedReducer<S, R>>();
  if (ref.current == null) {
    ref.current = createReducer<S, R>(reducers);
  }

  const { reducer, actions } = ref.current;

  const [state, dispatch] = useReducer(reducer, init);

  const dispatchActions = useMemo(
    () =>
      objectMap<typeof actions, CreatedReducerActionDispatch<S, R>>(
        actions,
        ([, action]) =>
          (payload: Parameters<typeof action>[0]) =>
            dispatch(action(payload))
      ),
    [actions]
  );

  return [state, dispatchActions];
}
