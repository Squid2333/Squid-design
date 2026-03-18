import type { ReactNode } from "react";

export type Store = Record<string, unknown>;
export type FieldErrors = Record<string, string[]>;

export type Rule = {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
  validator?: (value: unknown, values: Store) => void | Promise<void>;
};

export type FormInstance = {
  getFieldValue: (name: string) => unknown;
  getFieldsValue: () => Store;
  setFieldValue: (name: string, value: unknown) => void;
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
  name?: string;
  required?: boolean;
  rules?: Rule[];
  trigger?: string;
  valuePropName?: string;
};
