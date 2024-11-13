import { useState, useCallback } from "react";

export function useFormField<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string>("");

  const onChange = useCallback((newValue: T) => {
    setValue(newValue);
    setError("");
  }, []);

  return {
    value,
    onChange,
    error,
    setError,
    setValue,
  };
}
