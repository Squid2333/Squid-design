import "./style.css";
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import type { FieldErrors, FormItemProps, FormProps, Rule, Store } from "./interface";
import type { InternalFormInstance } from "./useForm";
import { useForm } from "./useForm";

type FormContextValue = {
  getFieldErrors: (name: string) => string[];
  getFieldValue: (name: string) => unknown;
  updateFieldValue: (name: string, value: unknown) => Promise<void>;
};

type FormComponent = ((props: FormProps) => ReactElement) & {
  Item: (props: FormItemProps) => ReactElement;
};

const FormContext = createContext<FormContextValue | null>(null);

function getDefaultStore(initialValues: Store | undefined) {
  return initialValues ? { ...initialValues } : {};
}

function getValueFromArgs(...args: unknown[]) {
  const [firstArg] = args;

  if (
    firstArg &&
    typeof firstArg === "object" &&
    "target" in firstArg &&
    firstArg.target &&
    typeof firstArg.target === "object" &&
    "value" in firstArg.target
  ) {
    return firstArg.target.value;
  }

  return firstArg;
}

function isEmptyValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return value === undefined || value === null || value === "";
}

function getValueLength(value: unknown) {
  if (typeof value === "string" || Array.isArray(value)) {
    return value.length;
  }

  return 0;
}

async function validateValue(
  name: string,
  value: unknown,
  values: Store,
  rules: Rule[] | undefined,
) {
  const errors: string[] = [];

  for (const rule of rules ?? []) {
    if (rule.required && isEmptyValue(value)) {
      errors.push(rule.message ?? `${name} is required`);
      continue;
    }

    if (isEmptyValue(value)) {
      continue;
    }

    if (rule.min !== undefined && getValueLength(value) < rule.min) {
      errors.push(rule.message ?? `${name} must be at least ${rule.min} characters`);
      continue;
    }

    if (rule.max !== undefined && getValueLength(value) > rule.max) {
      errors.push(rule.message ?? `${name} must be at most ${rule.max} characters`);
      continue;
    }

    if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
      errors.push(rule.message ?? `${name} format is invalid`);
      continue;
    }

    if (rule.validator) {
      try {
        await rule.validator(value, values);
      } catch (error) {
        errors.push(
          error instanceof Error
            ? error.message
            : rule.message ?? `${name} validation failed`,
        );
      }
    }
  }

  return errors;
}

function collectFieldRules(node: ReactNode, target: Record<string, Rule[]>) {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    const childProps = child.props as {
      children?: ReactNode;
      name?: string;
      rules?: Rule[];
    };

    if (typeof childProps.name === "string") {
      target[childProps.name] = childProps.rules ?? [];
    }

    if (childProps.children) {
      collectFieldRules(childProps.children, target);
    }
  });
}

function FormItem({
  children,
  getValueFromEvent,
  help,
  label,
  name,
  required = false,
  rules,
  trigger = "onChange",
  valuePropName = "value",
}: FormItemProps) {
  const context = useContext(FormContext);

  if (!context) {
    throw new Error("Form.Item must be used within Form");
  }

  const child = isValidElement(children) ? (children as ReactElement) : null;
  const fieldValue = name ? context.getFieldValue(name) : undefined;
  const errors = name ? context.getFieldErrors(name) : [];
  const mergedRequired = required || (rules ?? []).some((rule) => rule.required);
  const validateStatus = errors.length > 0 ? "error" : undefined;

  let control = child;

  if (name && child && isValidElement(child)) {
    const originalTrigger = (child.props as Record<string, unknown>)[trigger];

    control = cloneElement(child, {
      [trigger]: async (...args: unknown[]) => {
        const nextValue = getValueFromEvent
          ? getValueFromEvent(...args)
          : getValueFromArgs(...args);

        await context.updateFieldValue(name, nextValue);

        if (typeof originalTrigger === "function") {
          originalTrigger(...args);
        }
      },
      [valuePropName]: fieldValue,
      ...(validateStatus ? { status: validateStatus } : {}),
    } as Record<string, unknown>);
  }

  return (
    <div className="squid-form-item">
      {label ? (
        <label className="squid-form-item-label">
          {mergedRequired ? <span className="squid-form-item-required">*</span> : null}
          {label}
        </label>
      ) : null}

      <div className="squid-form-item-control">{control}</div>

      {errors.length > 0 ? (
        <div className="squid-form-item-explain">{errors[0]}</div>
      ) : help ? (
        <div className="squid-form-item-extra">{help}</div>
      ) : null}
    </div>
  );
}

function FormRoot({
  children,
  className,
  form,
  initialValues,
  onFinish,
  onFinishFailed,
}: FormProps) {
  const localForm = useForm();
  const formInstance = form ?? localForm;
  const [values, setValues] = useState<Store>(() => getDefaultStore(initialValues));
  const [errors, setErrors] = useState<FieldErrors>({});
  const initialValuesRef = useRef(getDefaultStore(initialValues));
  const formElementRef = useRef<HTMLFormElement>(null);
  const fieldRules = useMemo(() => {
    const nextFieldRules: Record<string, Rule[]> = {};
    collectFieldRules(children, nextFieldRules);
    return nextFieldRules;
  }, [children]);

  const validateSingleField = useCallback(
    async (name: string, nextValues: Store) => {
      const nextErrors = await validateValue(
        name,
        nextValues[name],
        nextValues,
        fieldRules[name],
      );

      setErrors((currentErrors) => ({
        ...currentErrors,
        [name]: nextErrors,
      }));

      return nextErrors;
    },
    [fieldRules],
  );

  const updateFieldValue = useCallback(
    async (name: string, value: unknown) => {
      const nextValues = {
        ...values,
        [name]: value,
      };

      // Validation uses the computed next snapshot so it doesn't lag behind state.
      setValues(nextValues);
      await validateSingleField(name, nextValues);
    },
    [validateSingleField, values],
  );

  const validateFields = useCallback(async () => {
    const nextErrorEntries = await Promise.all(
      Object.keys(fieldRules).map(async (name) => {
        const fieldErrorList = await validateValue(
          name,
          values[name],
          values,
          fieldRules[name],
        );

        return [name, fieldErrorList] as const;
      }),
    );

    const nextErrors = Object.fromEntries(nextErrorEntries);
    setErrors(nextErrors);

    if (Object.values(nextErrors).some((fieldErrorList) => fieldErrorList.length > 0)) {
      throw nextErrors;
    }

    return values;
  }, [fieldRules, values]);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    try {
      const validatedValues = await validateFields();
      onFinish?.(validatedValues);
    } catch (nextErrors) {
      onFinishFailed?.(nextErrors as FieldErrors, values);
    }
  }

  useEffect(() => {
    (formInstance as InternalFormInstance).__INTERNAL__.setApi({
      getFieldValue(name: string) {
        return values[name];
      },
      getFieldsValue() {
        return values;
      },
      resetFields() {
        setValues({ ...initialValuesRef.current });
        setErrors({});
      },
      setFieldValue(name: string, value: unknown) {
        void updateFieldValue(name, value);
      },
      setFieldsValue(nextValues: Store) {
        setValues((currentValues) => ({
          ...currentValues,
          ...nextValues,
        }));
      },
      submit() {
        formElementRef.current?.requestSubmit();
      },
      validateFields,
    });
  }, [formInstance, updateFieldValue, validateFields, values]);

  const contextValue: FormContextValue = {
    getFieldErrors(name) {
      return errors[name] ?? [];
    },
    getFieldValue(name) {
      return values[name];
    },
    updateFieldValue,
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form
        className={["squid-form", className].filter(Boolean).join(" ")}
        onSubmit={handleSubmit}
        ref={formElementRef}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

const Form = FormRoot as FormComponent;
Form.Item = FormItem;

export default Form;
