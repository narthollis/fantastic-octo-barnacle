import {
  FC,
  useReducer,
  useState,
  useEffect,
  useRef,
  Reducer,
  useMemo,
} from "react";

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
  initialState: S;
};

function objectMap<
  T extends Record<string, any>,
  R extends Record<keyof T, any>
>(
  obj: T,
  map: <K extends keyof T>(entry: [K, T[K]], index: number) => R[K]
): R {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v], i) => [k, map([k, v], i)])
  ) as R;
}

function createReducer<S, R extends CaseReducers<S>>(
  initialState: S,
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
    initialState,
  };
}

function useCreateReducer<S, R extends CaseReducers<S>>(
  initialState: S,
  reducers: R
): [S, CreatedReducerActionDispatch<S, R>] {
  const ref = useRef<CreatedReducer<S, R>>();
  if (ref.current == null) {
    ref.current = createReducer(initialState, reducers);
  }

  const { reducer, actions } = ref.current;

  const [state, dispatch] = useReducer(reducer, initialState);

  const dispatchActions = useMemo(
    () =>
      objectMap<typeof actions, CreatedReducerActionDispatch<S, R>>(
        actions,
        ([, action]) =>
          (payload: Parameters<typeof action>[0]) =>
            dispatch(action(payload))
      ),
    [dispatch, actions]
  );

  return [state, dispatchActions];
}

// /////////////////////////////////////////////////////////////////////////////

interface MyState {
  readonly count: number;
}

export const Sheet: FC = () => {
  const [store, { decrement, increment, set }] = useCreateReducer(
    { count: 0 },
    {
      increment: (state: MyState) => ({
        ...state,
        count: state.count + 1,
      }),
      decrement: (state: MyState) => ({
        ...state,
        count: state.count - 1,
      }),
      set: (state: MyState, count: number) => ({
        ...state,
        count,
      }),
    }
  );

  const [forceValue, setForceValue] = useState<number | undefined>();
  useEffect(() => {
    setForceValue(undefined);
  }, [store]);

  return (
    <div>
      <h1>{store.count}</h1>
      <button onClick={() => increment()}>Increment</button>
      <button onClick={() => decrement()}>Decrement</button>
      <input
        value={forceValue ?? ""}
        type="number"
        onChange={(e) => setForceValue(e.target?.valueAsNumber)}
      />
      <button
        disabled={forceValue == null}
        onClick={() => forceValue != null && set(forceValue)}
      >
        Set
      </button>
    </div>
  );
};
