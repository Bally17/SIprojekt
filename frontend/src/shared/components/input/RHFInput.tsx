import type {
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form";

type RHFInputProps<T extends FieldValues> = {
  name: Path<T>;
  register: UseFormRegister<T>;
  rules?: RegisterOptions<T, Path<T>>;
  errors?: FieldErrors<T>;
  placeholder: string;
  type?: React.HTMLInputTypeAttribute;
  className?: string;
};

function RHFInput<T extends FieldValues>({
  name,
  register,
  rules,
  errors,
  placeholder,
  type = "text",
  className,
}: Readonly<RHFInputProps<T>>) {
  const message = errors?.[name]?.message as string | undefined;

  return (
    <input
      type={type}
      placeholder={placeholder}
      className={className}
      aria-invalid={Boolean(message)}
      aria-describedby={message ? `${String(name)}-error` : undefined}
      {...register(name, rules)}
    />
  );
}

export default RHFInput;
