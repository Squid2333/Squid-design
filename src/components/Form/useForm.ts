import { useState } from "react";
import type { FormInstance, NamePath, Store } from "./interface";

type FormApi = {
  getFieldValue: (name: NamePath) => unknown;
  getFieldsValue: () => Store;
  setFieldValue: (name: NamePath, value: unknown) => void;
  setFieldsValue: (values: Store) => void;
  resetFields: () => void;
  submit: () => void;
  validateFields: () => Promise<Store>;
};

type InternalFormInstance = FormInstance & {
  __INTERNAL__: {
    setApi: (api: FormApi) => void;
  };
};

function createFormInstance(): InternalFormInstance {
  let api: FormApi = {
    getFieldValue: () => undefined,
    getFieldsValue: () => ({}),
    resetFields: () => undefined,
    setFieldValue: () => undefined,
    setFieldsValue: () => undefined,
    submit: () => undefined,
    validateFields: async () => ({}),
  };

  return {
    __INTERNAL__: {
      setApi(nextApi) {
        api = nextApi;
      },
    },
    getFieldValue(name) {
      return api.getFieldValue(name);
    },
    getFieldsValue() {
      return api.getFieldsValue();
    },
    resetFields() {
      api.resetFields();
    },
    setFieldValue(name, value) {
      api.setFieldValue(name, value);
    },
    setFieldsValue(values) {
      api.setFieldsValue(values);
    },
    submit() {
      api.submit();
    },
    validateFields() {
      return api.validateFields();
    },
  };
}

export function useForm() {
  return useState<FormInstance>(() => createFormInstance())[0];
}

export type { InternalFormInstance };
