import { FC, useState, useEffect, useRef } from "react";
import { useCreateReducer } from "../tools/typed_reducer";

// /////////////////////////////////////////////////////////////////////////////

interface Character {
  readonly attributes: {
    readonly str: number;
    readonly dex: number;
    readonly con: number;
    readonly int: number;
    readonly wis: number;
    readonly cha: number;
  };
}

const emptyCharacter: Character = {
  attributes: {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  },
};

export const Sheet: FC = () => {
  const [store, { setStr }] = useCreateReducer(
    {
      setStr(s, value: number) {
        return { ...s, attributes: { ...s.attributes, str: value } };
      },
    },
    emptyCharacter
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
