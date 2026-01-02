"use client";

import { useId } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import styles from "@styles/Input.module.scss";
type InputType = React.HTMLInputTypeAttribute;

interface InputProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label?: string;
  placeholder?: string;
  type?: InputType;
  autoComplete?: string;
  disabled?: boolean;
  textarea?: boolean;
  rows?: number;
}

export default function Input<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  autoComplete,
  disabled,
  textarea = false,
  rows = 5,
}: InputProps<TFieldValues>) {
  const id = useId();

  return (
    <div className={styles.input}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => {
          const hasError = !!fieldState.error;
          return (
            <>
              {textarea ? (
                <textarea
                  id={id}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  disabled={disabled}
                  rows={rows}
                  value={(field.value ?? "") as string}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  className={hasError ? styles.errorInput : ""}
                />
              ) : (
                <input
                  id={id}
                  type={type}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  disabled={disabled}
                  value={(field.value ?? "") as string}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  className={hasError ? styles.errorInput : ""}
                />
              )}
              {fieldState.error?.message ? (
                <small role="alert" className={styles.errorText}>
                  {fieldState.error.message}
                </small>
              ) : null}
            </>
          );
        }}
      />
    </div>
  );
}
