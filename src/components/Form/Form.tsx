import "./style.css";
import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import type {
  FieldErrors,
  FieldMeta,
  FormItemProps,
  FormProps,
  NamePath,
  NameSegment,
  Rule,
  Store,
  ValidateTrigger,
} from "./interface";
import type { InternalFormInstance } from "./useForm";
import { useForm } from "./useForm";

type FormContextValue = {
  getFieldErrors: (name: NamePath) => string[];
  getFieldMeta: (name: NamePath) => FieldMeta;
  getFieldValue: (name: NamePath) => unknown;
  registerField: (name: NamePath, rules: Rule[] | undefined) => void;
  unregisterField: (name: NamePath) => void;
  subscribeField: (name: NamePath, listener: () => void) => () => void;
  touchField: (name: NamePath) => void;
  updateFieldValue: (
    name: NamePath,
    value: unknown,
    options?: {
      shouldTouch?: boolean;
      shouldValidate?: boolean;
    },
  ) => Promise<void>;
  validateField: (name: NamePath) => Promise<string[]>;
};

type FormComponent = ((props: FormProps) => ReactElement) & {
  Item: (props: FormItemProps) => ReactElement;
};

const FormContext = createContext<FormContextValue | null>(null);
const DEFAULT_FIELD_META: FieldMeta = {
  dirty: false,
  touched: false,
  validating: false,
};

function getDefaultStore(initialValues: Store | undefined) {
  return initialValues ? { ...initialValues } : {};
}

function toNamePath(name: NamePath) {
  if (Array.isArray(name)) {
    return name;
  }

  if (typeof name === "number") {
    return [name];
  }

  return name.split(".").filter(Boolean);
}

function getNameKey(name: NamePath) {
  return toNamePath(name).join(".");
}

function getPathLabel(name: NamePath) {
  return getNameKey(name);
}

function cloneContainer(value: unknown) {
  if (Array.isArray(value)) {
    return [...value];
  }

  if (value && typeof value === "object") {
    return { ...(value as Record<string, unknown>) };
  }

  return {};
}

function getValueByPath(store: Store, name: NamePath) {
  return toNamePath(name).reduce<unknown>((currentValue, segment) => {
    if (currentValue == null || typeof currentValue !== "object") {
      return undefined;
    }

    return (currentValue as Record<NameSegment, unknown>)[segment];
  }, store);
}

function setValueByPath(store: Store, name: NamePath, value: unknown) {
  const path = toNamePath(name);

  if (path.length === 0) {
    return store;
  }

  const nextStore = cloneContainer(store) as Store;
  let currentTarget: Record<NameSegment, unknown> = nextStore;

  path.forEach((segment, index) => {
    const isLastSegment = index === path.length - 1;

    if (isLastSegment) {
      currentTarget[segment] = value;
      return;
    }

    const nextSegment = path[index + 1];
    const currentValue = currentTarget[segment];
    const fallbackContainer = typeof nextSegment === "number" ? [] : {};
    const nextValue =
      currentValue && typeof currentValue === "object"
        ? cloneContainer(currentValue)
        : fallbackContainer;

    currentTarget[segment] = nextValue;
    currentTarget = nextValue as Record<NameSegment, unknown>;
  });

  return nextStore;
}

function mergeStore(target: Store, source: Store) {
  const nextTarget = cloneContainer(target) as Store;

  Object.entries(source).forEach(([key, value]) => {
    const currentValue = nextTarget[key];

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      currentValue &&
      typeof currentValue === "object" &&
      !Array.isArray(currentValue)
    ) {
      nextTarget[key] = mergeStore(currentValue as Store, value as Store);
      return;
    }

    nextTarget[key] = value;
  });

  return nextTarget;
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
  name: NamePath,
  value: unknown,
  values: Store,
  rules: Rule[] | undefined,
) {
  const errors: string[] = [];
  const fieldLabel = getPathLabel(name);

  for (const rule of rules ?? []) {
    if (rule.required && isEmptyValue(value)) {
      errors.push(rule.message ?? `${fieldLabel} is required`);
      continue;
    }

    if (isEmptyValue(value)) {
      continue;
    }

    if (rule.min !== undefined && getValueLength(value) < rule.min) {
      errors.push(rule.message ?? `${fieldLabel} must be at least ${rule.min} characters`);
      continue;
    }

    if (rule.max !== undefined && getValueLength(value) > rule.max) {
      errors.push(rule.message ?? `${fieldLabel} must be at most ${rule.max} characters`);
      continue;
    }

    if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
      errors.push(rule.message ?? `${fieldLabel} format is invalid`);
      continue;
    }

    if (rule.validator) {
      try {
        await rule.validator(value, values);
      } catch (error) {
        errors.push(
          error instanceof Error
            ? error.message
            : rule.message ?? `${fieldLabel} validation failed`,
        );
      }
    }
  }

  return errors;
}

function toTriggerList(trigger: ValidateTrigger | undefined, fallback: string) {
  if (!trigger) {
    return [fallback];
  }

  return Array.isArray(trigger) ? trigger : [trigger];
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
  validateTrigger = "onChange",
  valuePropName = "value",
}: FormItemProps) {
  const context = useContext(FormContext);
  const [, forceUpdate] = useState(0);

  if (!context) {
    throw new Error("Form.Item must be used within Form");
  }

  const child = isValidElement(children) ? (children as ReactElement) : null;
  const fieldValue = name ? context.getFieldValue(name) : undefined;
  const errors = name ? context.getFieldErrors(name) : [];
  const fieldMeta = name ? context.getFieldMeta(name) : DEFAULT_FIELD_META;
  const mergedRequired = required || (rules ?? []).some((rule) => rule.required);
  const validateStatus = fieldMeta.validating ? "validating" : errors.length > 0 ? "error" : undefined;

  useEffect(() => {
    if (!name) {
      return;
    }

    return context.subscribeField(name, () => {
      forceUpdate((currentValue) => currentValue + 1);
    });
  }, [context, name]);

  useEffect(() => {
    if (!name) {
      return;
    }

    context.registerField(name, rules);

    return () => {
      context.unregisterField(name);
    };
  }, [context, name, rules]);

  let control = child;

  if (name && child && isValidElement(child)) {
    const childProps = child.props as Record<string, unknown>;
    const validateTriggers = new Set(toTriggerList(validateTrigger, trigger));
    const eventNames = new Set([trigger, ...validateTriggers]);
    const controlProps: Record<string, unknown> = {
      [valuePropName]: fieldValue,
      ...(validateStatus ? { status: validateStatus } : {}),
    };

    eventNames.forEach((eventName) => {
      const originalHandler = childProps[eventName];

      controlProps[eventName] = async (...args: unknown[]) => {
        if (eventName === trigger) {
          const nextValue = getValueFromEvent
            ? getValueFromEvent(...args)
            : getValueFromArgs(...args);

          await context.updateFieldValue(name, nextValue, {
            shouldTouch: true,
            shouldValidate: validateTriggers.has(eventName),
          });
        } else {
          context.touchField(name);

          if (validateTriggers.has(eventName)) {
            await context.validateField(name);
          }
        }

        if (typeof originalHandler === "function") {
          originalHandler(...args);
        }
      };
    });

    control = cloneElement(child, controlProps);
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
  const initialValuesRef = useRef(getDefaultStore(initialValues));
  const formElementRef = useRef<HTMLFormElement>(null);
  const valuesRef = useRef<Store>(getDefaultStore(initialValues));
  const errorsRef = useRef<FieldErrors>({});
  const fieldMetaRef = useRef<Record<string, FieldMeta>>({});
  const fieldRulesRef = useRef<Record<string, Rule[]>>({});
  const fieldListenersRef = useRef<Map<string, Set<() => void>>>(new Map());

  const notifyFields = useCallback((names: NamePath[]) => {
    const listenerSet = new Set<() => void>();

    names.forEach((name) => {
      const nameKey = getNameKey(name);
      const listeners = fieldListenersRef.current.get(nameKey);

      listeners?.forEach((listener) => {
        listenerSet.add(listener);
      });
    });

    listenerSet.forEach((listener) => {
      listener();
    });
  }, []);

  const setFieldErrors = useCallback((name: NamePath, nextErrors: string[]) => {
    const nameKey = getNameKey(name);

    if (errorsRef.current[nameKey] === nextErrors) {
      return;
    }

    errorsRef.current = {
      ...errorsRef.current,
      [nameKey]: nextErrors,
    };
  }, []);

  const registerField = useCallback((name: NamePath, rules: Rule[] | undefined) => {
    const nameKey = getNameKey(name);
    fieldRulesRef.current[nameKey] = rules ?? [];
    fieldMetaRef.current = {
      ...fieldMetaRef.current,
      [nameKey]: fieldMetaRef.current[nameKey] ?? DEFAULT_FIELD_META,
    };
    notifyFields([name]);
  }, []);

  const unregisterField = useCallback((name: NamePath) => {
    const nameKey = getNameKey(name);
    delete fieldRulesRef.current[nameKey];
    fieldListenersRef.current.delete(nameKey);

    if (nameKey in errorsRef.current) {
      const nextErrors = { ...errorsRef.current };
      delete nextErrors[nameKey];
      errorsRef.current = nextErrors;
    }

    if (nameKey in fieldMetaRef.current) {
      const nextMeta = { ...fieldMetaRef.current };
      delete nextMeta[nameKey];
      fieldMetaRef.current = nextMeta;
    }
  }, []);

  const updateFieldMeta = useCallback((name: NamePath, updater: (currentMeta: FieldMeta) => FieldMeta) => {
    const nameKey = getNameKey(name);
    const currentMeta = fieldMetaRef.current[nameKey] ?? DEFAULT_FIELD_META;
    const nextMeta = updater(currentMeta);

    if (
      currentMeta.dirty === nextMeta.dirty &&
      currentMeta.touched === nextMeta.touched &&
      currentMeta.validating === nextMeta.validating
    ) {
      return false;
    }

    fieldMetaRef.current = {
      ...fieldMetaRef.current,
      [nameKey]: nextMeta,
    };

    return true;
  }, []);

  const subscribeField = useCallback((name: NamePath, listener: () => void) => {
    const nameKey = getNameKey(name);
    const listeners = fieldListenersRef.current.get(nameKey) ?? new Set<() => void>();

    listeners.add(listener);
    fieldListenersRef.current.set(nameKey, listeners);

    return () => {
      const currentListeners = fieldListenersRef.current.get(nameKey);

      if (!currentListeners) {
        return;
      }

      currentListeners.delete(listener);

      if (currentListeners.size === 0) {
        fieldListenersRef.current.delete(nameKey);
      }
    };
  }, []);

  const validateSingleField = useCallback(
    async (name: NamePath, nextValues: Store) => {
      const nameKey = getNameKey(name);
      const didStartValidating = updateFieldMeta(name, (currentMeta) => ({
        ...currentMeta,
        validating: true,
      }));
      if (didStartValidating) {
        notifyFields([name]);
      }

      const nextErrors = await validateValue(
        name,
        getValueByPath(nextValues, name),
        nextValues,
        fieldRulesRef.current[nameKey],
      );

      setFieldErrors(name, nextErrors);
      updateFieldMeta(name, (currentMeta) => ({
        ...currentMeta,
        validating: false,
      }));
      notifyFields([name]);

      return nextErrors;
    },
    [notifyFields, setFieldErrors, updateFieldMeta],
  );

  const updateFieldValue = useCallback(
    async (
      name: NamePath,
      value: unknown,
      options?: {
        shouldTouch?: boolean;
        shouldValidate?: boolean;
      },
    ) => {
      const currentValue = getValueByPath(valuesRef.current, name);

      if (Object.is(currentValue, value)) {
        if (options?.shouldTouch) {
          const didUpdateMeta = updateFieldMeta(name, (currentMeta) => ({
            ...currentMeta,
            touched: true,
          }));

          if (didUpdateMeta) {
            notifyFields([name]);
          }
        }

        if (options?.shouldValidate ?? true) {
          await validateSingleField(name, valuesRef.current);
        }

        return;
      }

      const nextValues = setValueByPath(valuesRef.current, name, value);
      const nextDirty = getValueByPath(initialValuesRef.current, name) !== value;

      valuesRef.current = nextValues;
      updateFieldMeta(name, (currentMeta) => ({
        ...currentMeta,
        dirty: nextDirty,
        touched: options?.shouldTouch ?? currentMeta.touched,
      }));
      notifyFields([name]);

      if (options?.shouldValidate ?? true) {
        await validateSingleField(name, nextValues);
      }
    },
    [notifyFields, updateFieldMeta, validateSingleField],
  );

  const validateFields = useCallback(async () => {
    const fieldNames = Object.keys(fieldRulesRef.current);
    const nextErrors: FieldErrors = {};

    fieldNames.forEach((name) => {
      updateFieldMeta(name, (currentMeta) => ({
        ...currentMeta,
        validating: true,
      }));
    });
    notifyFields(fieldNames);

    const nextErrorEntries = await Promise.all(
      fieldNames.map(async (name) => {
        const fieldErrorList = await validateValue(
          name,
          getValueByPath(valuesRef.current, name),
          valuesRef.current,
          fieldRulesRef.current[name],
        );

        return [name, fieldErrorList] as const;
      }),
    );

    nextErrorEntries.forEach(([name, fieldErrorList]) => {
      nextErrors[name] = fieldErrorList;
      updateFieldMeta(name, (currentMeta) => ({
        ...currentMeta,
        validating: false,
      }));
    });

    errorsRef.current = nextErrors;
    notifyFields(fieldNames);

    if (Object.values(nextErrors).some((fieldErrorList) => fieldErrorList.length > 0)) {
      throw nextErrors;
    }

    return valuesRef.current;
  }, [notifyFields, updateFieldMeta]);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    try {
      const validatedValues = await validateFields();
      onFinish?.(validatedValues);
    } catch (nextErrors) {
      onFinishFailed?.(nextErrors as FieldErrors, valuesRef.current);
    }
  }

  const validateField = useCallback(
    async (name: NamePath) => validateSingleField(name, valuesRef.current),
    [validateSingleField],
  );

  const touchField = useCallback(
    (name: NamePath) => {
      const didUpdateMeta = updateFieldMeta(name, (currentMeta) => ({
        ...currentMeta,
        touched: true,
      }));

      if (didUpdateMeta) {
        notifyFields([name]);
      }
    },
    [notifyFields, updateFieldMeta],
  );

  useEffect(() => {
    (formInstance as InternalFormInstance).__INTERNAL__.setApi({
      getFieldValue(name: NamePath) {
        return getValueByPath(valuesRef.current, name);
      },
      getFieldsValue() {
        return valuesRef.current;
      },
      resetFields() {
        valuesRef.current = getDefaultStore(initialValuesRef.current);
        errorsRef.current = {};
        fieldMetaRef.current = {};
        notifyFields(Object.keys(fieldRulesRef.current));
      },
      setFieldValue(name: NamePath, value: unknown) {
        void updateFieldValue(name, value, {
          shouldTouch: false,
          shouldValidate: false,
        });
      },
      setFieldsValue(nextValues: Store) {
        const mergedValues = mergeStore(valuesRef.current, nextValues);
        const changedFieldNames = Object.keys(fieldRulesRef.current).filter((name) => {
          const currentValue = getValueByPath(valuesRef.current, name);
          const nextValue = getValueByPath(mergedValues, name);

          return !Object.is(currentValue, nextValue);
        });

        valuesRef.current = mergedValues;
        changedFieldNames.forEach((name) => {
          updateFieldMeta(name, (currentMeta) => ({
            ...currentMeta,
            dirty:
              getValueByPath(initialValuesRef.current, name) !==
              getValueByPath(mergedValues, name),
          }));
        });

        if (changedFieldNames.length > 0) {
          notifyFields(changedFieldNames);
        }
      },
      submit() {
        formElementRef.current?.requestSubmit();
      },
      validateFields,
    });
  }, [formInstance, notifyFields, updateFieldValue, updateFieldMeta, validateFields]);

  const contextValue: FormContextValue = {
    getFieldErrors(name) {
      return errorsRef.current[getNameKey(name)] ?? [];
    },
    getFieldMeta(name) {
      return fieldMetaRef.current[getNameKey(name)] ?? DEFAULT_FIELD_META;
    },
    getFieldValue(name) {
      return getValueByPath(valuesRef.current, name);
    },
    registerField,
    subscribeField,
    touchField,
    unregisterField,
    updateFieldValue,
    validateField,
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
