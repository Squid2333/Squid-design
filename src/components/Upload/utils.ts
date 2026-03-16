import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type {
  CustomRequestOptions,
  UploadFile,
  UploadProps,
} from "./interface";

const MEASURE_SIZE = 200;

function isImageFileType(type: string) {
  return type.startsWith("image/");
}

export function previewImage(file: File | Blob): Promise<string> {
  return new Promise<string>((resolve) => {
    if (!file.type || !isImageFileType(file.type)) {
      resolve("");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = MEASURE_SIZE;
    canvas.height = MEASURE_SIZE;
    canvas.style.cssText = `position: fixed; left: 0; top: 0; width: ${MEASURE_SIZE}px; height: ${MEASURE_SIZE}px; z-index: 9999; display: none;`;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const { height, width } = img;
      let drawWidth = MEASURE_SIZE;
      let drawHeight = MEASURE_SIZE;
      let offsetX = 0;
      let offsetY = 0;

      if (width > height) {
        drawHeight = height * (MEASURE_SIZE / width);
        offsetY = (MEASURE_SIZE - drawHeight) / 2;
      } else {
        drawWidth = width * (MEASURE_SIZE / height);
        offsetX = (MEASURE_SIZE - drawWidth) / 2;
      }

      ctx?.clearRect(0, 0, MEASURE_SIZE, MEASURE_SIZE);
      ctx?.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      const dataURL = canvas.toDataURL();
      document.body.removeChild(canvas);

      if (img.src.startsWith("blob:")) {
        window.URL.revokeObjectURL(img.src);
      }

      resolve(dataURL);
    };

    img.crossOrigin = "anonymous";

    if (file.type.startsWith("image/svg+xml")) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          img.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("image/gif")) {
      const reader = new FileReader();
      reader.onload = () => {
        document.body.removeChild(canvas);
        resolve((reader.result as string) ?? "");
      };
      reader.readAsDataURL(file);
    } else {
      img.src = window.URL.createObjectURL(file);
    }
  });
}

function createUid() {
  return `upload_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function toUploadFile(file: File): Promise<UploadFile> {
  const thumbUrl = isImageFileType(file.type) ? await previewImage(file) : undefined;

  return {
    uid: createUid(),
    name: file.name,
    originFileObj: file,
    percent: 0,
    status: "uploading",
    thumbUrl,
  };
}

function useMergedFileList(
  controlledFileList: UploadFile[] | undefined,
  defaultFileList: UploadFile[] | undefined,
) {
  const [innerFileList, setInnerFileList] = useState<UploadFile[]>(
    defaultFileList ?? [],
  );

  return {
    mergedFileList: controlledFileList ?? innerFileList,
    setMergedFileList: (nextFileList: UploadFile[]) => {
      if (controlledFileList === undefined) {
        setInnerFileList(nextFileList);
      }
    },
  };
}

function patchFile(
  fileList: UploadFile[],
  uid: string,
  updater: (file: UploadFile) => UploadFile,
) {
  return fileList.map((file) => (file.uid === uid ? updater(file) : file));
}

function defaultRequest({
  onError,
  onProgress,
  onSuccess,
}: CustomRequestOptions) {
  let currentPercent = 0;

  const timer = window.setInterval(() => {
    currentPercent += 25;

    if (currentPercent >= 100) {
      window.clearInterval(timer);
      onProgress(100);
      window.setTimeout(() => {
        try {
          onSuccess();
        } catch (error) {
          onError(error instanceof Error ? error : new Error("Upload failed"));
        }
      }, 120);
      return;
    }

    onProgress(currentPercent);
  }, 120);
}

export function useUploadController({
  beforeUpload,
  customRequest,
  defaultFileList,
  fileList,
  multiple = false,
  onChange,
  onRemove,
}: Pick<
  UploadProps,
  | "beforeUpload"
  | "customRequest"
  | "defaultFileList"
  | "fileList"
  | "multiple"
  | "onChange"
  | "onRemove"
>) {
  const mergedFileListRef = useRef<UploadFile[]>([]);
  const { mergedFileList, setMergedFileList } = useMergedFileList(
    fileList,
    defaultFileList,
  );

  useEffect(() => {
    mergedFileListRef.current = mergedFileList;
  }, [mergedFileList]);

  function emitChange(nextFileList: UploadFile[]) {
    mergedFileListRef.current = nextFileList;
    setMergedFileList(nextFileList);
    onChange?.(nextFileList);
  }

  function updateFile(uid: string, updater: (file: UploadFile) => UploadFile) {
    const nextFileList = patchFile(mergedFileListRef.current, uid, updater);
    emitChange(nextFileList);
  }

  function startUpload(uploadFile: UploadFile, rawFile: File) {
    const request = customRequest ?? defaultRequest;

    request({
      file: rawFile,
      onProgress: (percent) => {
        updateFile(uploadFile.uid, (file) => ({
          ...file,
          percent,
          status: "uploading",
        }));
      },
      onSuccess: (response) => {
        updateFile(uploadFile.uid, (file) => ({
          ...file,
          percent: 100,
          response,
          status: "done",
        }));
      },
      onError: (error) => {
        updateFile(uploadFile.uid, (file) => ({
          ...file,
          error: error.message,
          status: "error",
        }));
      },
    });
  }

  async function processFile(rawFile: File, rawFileList: File[]) {
    let parsedFile: File = rawFile;

    if (beforeUpload) {
      const beforeUploadResult = await beforeUpload(rawFile, rawFileList);

      if (beforeUploadResult === false) {
        const invalidFile: UploadFile = {
          ...(await toUploadFile(rawFile)),
          error: "File validation failed before upload.",
          percent: undefined,
          status: "error",
        };
        emitChange([...mergedFileListRef.current, invalidFile]);
        return;
      }

      if (beforeUploadResult instanceof File) {
        parsedFile = beforeUploadResult;
      }
    }

    const uploadFile = await toUploadFile(parsedFile);
    emitChange([...mergedFileListRef.current, uploadFile]);
    startUpload(uploadFile, parsedFile);
  }

  function getValidFiles(rawFiles: File[]) {
    return multiple ? rawFiles : rawFiles.slice(0, 1);
  }

  async function processFiles(rawFiles: File[]) {
    const validFiles = getValidFiles(rawFiles);

    for (const file of validFiles) {
      // Sequential updates keep list ordering stable and avoid stale closures.
      // eslint-disable-next-line no-await-in-loop
      await processFile(file, validFiles);
    }
  }

  async function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const rawFiles = Array.from(event.target.files ?? []);
    await processFiles(rawFiles);
    event.target.value = "";
  }

  function handleRemove(file: UploadFile) {
    const removeResult = onRemove?.(file);

    if (removeResult === false) {
      return;
    }

    const nextFileList = mergedFileList.filter((item) => item.uid !== file.uid);
    emitChange(nextFileList);
  }

  return {
    handleInputChange,
    handleRemove,
    mergedFileList,
    processFiles,
  };
}
