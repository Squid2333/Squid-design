import "./style.css";
import { useId, useRef } from "react";
import Button from "../Button";
import type { UploadProps } from "./interface";
import { useUploadController } from "./utils";

export default function Upload({
  accept,
  beforeUpload,
  children,
  customRequest,
  defaultFileList,
  fileList,
  multiple = false,
  onChange,
  onRemove,
}: UploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleInputChange, handleRemove, mergedFileList } = useUploadController({
    beforeUpload,
    customRequest,
    defaultFileList,
    fileList,
    multiple,
    onChange,
    onRemove,
  });

  return (
    <div className="squid-upload">
      <input
        accept={accept}
        className="squid-upload-input"
        id={inputId}
        multiple={multiple}
        onChange={handleInputChange}
        ref={inputRef}
        type="file"
      />

      <div className="squid-upload-trigger">
        {children ? (
          <div onClick={() => inputRef.current?.click()} role="presentation">
            {children}
          </div>
        ) : (
          <Button onClick={() => inputRef.current?.click()} type="default">
            Select File
          </Button>
        )}
      </div>

      {mergedFileList.length > 0 ? (
        <div className="squid-upload-list">
          {mergedFileList.map((file) => (
            <div className="squid-upload-list-item" key={file.uid}>
              <div className="squid-upload-list-row">
                {file.thumbUrl ? (
                  <img
                    alt={file.name}
                    className="squid-upload-thumbnail"
                    src={file.thumbUrl}
                  />
                ) : (
                  <div className="squid-upload-thumbnail squid-upload-thumbnail-placeholder">
                    FILE
                  </div>
                )}

                <div className="squid-upload-list-main">
                  <span className="squid-upload-file-name">{file.name}</span>
                  <span
                    className={[
                      "squid-upload-file-status",
                      file.status && `squid-upload-file-status-${file.status}`,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {file.status ?? "ready"}
                  </span>
                </div>
              </div>

              {typeof file.percent === "number" &&
              file.status === "uploading" ? (
                <div className="squid-upload-progress">
                  <div
                    className="squid-upload-progress-bar"
                    style={{ width: `${file.percent}%` }}
                  />
                </div>
              ) : null}

              {file.error ? (
                <div className="squid-upload-error">{file.error}</div>
              ) : null}

              <button
                className="squid-upload-remove"
                onClick={() => handleRemove(file)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
