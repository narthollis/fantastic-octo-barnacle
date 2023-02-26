import { FC, useReducer, useState, useEffect, Reducer } from "react";

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

type Foo = CaseReducerPayload<number, (x: number) => number>;

type CreatedReducerActions<S, R extends CaseReducers<S>> = {
  [K in keyof R]: PayloadAction<CaseReducerPayload<S, R[K]>, K>;
};

type CreatedReducerActionCreator<S, R extends CaseReducers<S>> = {
  [K in keyof R]: (
    payload: CaseReducerPayload<S, R[K]>
  ) => PayloadAction<CaseReducerPayload<S, R[K]>, K>;
};

type CreatedReducer<S, R extends CaseReducers<S>> = {
  reducer: Reducer<S, CreatedReducerActions<S, R>[keyof R]>;
  actions: CreatedReducerActionCreator<S, R>;
  initialState: S;
};

function createReducer<S, R extends CaseReducers<S>>(
  initialState: S,
  reducers: R
): CreatedReducer<S, R> {
  const actions = {} as CreatedReducerActionCreator<S, R>;
  for (const type of Object.keys(reducers)) {
    actions[type as keyof R] = (payload: any) => ({ type, payload });
  }

  return {
    reducer: (state, action) =>
      reducers[action.type]?.(state, action.payload) ?? state,
    actions,
    initialState,
  };
}

// /////////////////////////////////////////////////////////////////////////////

interface MyState {
  readonly count: number;
}

const {
  actions: { decrement, increment, set },
  reducer,
  initialState,
} = createReducer(
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

decrement();
increment();
set(13);

export const Sheet: FC = () => {
  const [store, dispatch] = useReducer(reducer, initialState);

  const [forceValue, setForceValue] = useState<number | undefined>();
  useEffect(() => {
    setForceValue(undefined);
  }, [store]);

  return (
    <div>
      <h1>{store.count}</h1>
      <button onClick={() => dispatch(increment())}>Increment</button>
      <button onClick={() => dispatch(decrement())}>Decrement</button>
      <input
        value={forceValue ?? ""}
        type="number"
        onChange={(e) => setForceValue(e.target?.valueAsNumber)}
      />
      <button
        disabled={forceValue == null}
        onClick={() => forceValue != null && dispatch(set(forceValue))}
      >
        Set
      </button>
    </div>
  );
};
