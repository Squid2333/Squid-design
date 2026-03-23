import type { ReactNode } from "react";

export type UploadStatus = "uploading" | "done" | "error" | "removed";

export type UploadFile = {
  uid: string;
  name: string;
  status?: UploadStatus;
  percent?: number;
  originFileObj?: File;
  response?: unknown;
  error?: string;
  thumbUrl?: string;
};

export type BeforeUploadResult = boolean | File;
export type BeforeUpload = (
  file: File,
  fileList: File[],
) => BeforeUploadResult | Promise<BeforeUploadResult>;

export type CustomRequestOptions = {
  file: File;
  onProgress: (percent: number) => void;
  onSuccess: (response?: unknown) => void;
  onError: (error: Error) => void;
};

export type UploadProps = {
  accept?: string;
  beforeUpload?: BeforeUpload;
  children?: ReactNode;
  customRequest?: (options: CustomRequestOptions) => void;
  defaultFileList?: UploadFile[];
  fileList?: UploadFile[];
  multiple?: boolean;
  onChange?: (fileList: UploadFile[]) => void;
  onRemove?: (file: UploadFile) => void | boolean;
};
