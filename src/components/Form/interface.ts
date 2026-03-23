import type { ReactNode } from "react";

export type Store = Record<string, unknown>;
export type FieldErrors = Record<string, string[]>;
export type ValidateTrigger = string | string[];
export type NameSegment = string | number;
export type NamePath = NameSegment | NameSegment[];

export type FieldMeta = {
  dirty: boolean;
  touched: boolean;
  validating: boolean;
};

export type Rule = {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
  validator?: (value: unknown, values: Store) => void | Promise<void>;
};

export type FormInstance = {
  getFieldValue: (name: NamePath) => unknown;
  getFieldsValue: () => Store;
  setFieldValue: (name: NamePath, value: unknown) => void;
  setFieldsValue: (values: Store) => void;
  resetFields: () => void;
  validateFields: () => Promise<Store>;
  submit: () => void;
};

export type FormProps = {
  children?: ReactNode;
  className?: string;
  form?: FormInstance;
  initialValues?: Store;
  onFinish?: (values: Store) => void;
  onFinishFailed?: (errors: FieldErrors, values: Store) => void;
};

export type FormItemProps = {
  children?: ReactNode;
  getValueFromEvent?: (...args: unknown[]) => unknown;
  help?: ReactNode;
  label?: ReactNode;
  name?: NamePath;
  required?: boolean;
  rules?: Rule[];
  trigger?: string;
  validateTrigger?: ValidateTrigger;
  valuePropName?: string;
};
