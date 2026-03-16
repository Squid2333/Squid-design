import "./style.css";
import { useId, useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";
import type { UploadProps } from "./interface";
import { useUploadController } from "./utils";

type DraggerProps = UploadProps & {
  description?: ReactNode;
  title?: ReactNode;
};

function InboxIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="40"
      viewBox="0 0 40 40"
      width="40"
    >
      <path
        d="M8 14L13 8H27L32 14V29C32 30.1046 31.1046 31 30 31H10C8.89543 31 8 30.1046 8 29V14Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M14 20H18L20 24L22 20H26"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function Dragger({
  accept,
  beforeUpload,
  children,
  customRequest,
  defaultFileList,
  description = "Click or drag file to this area to upload",
  fileList,
  multiple = false,
  onChange,
  onRemove,
  title = "Drag files here",
}: DraggerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { handleInputChange, handleRemove, mergedFileList, processFiles } =
    useUploadController({
      beforeUpload,
      customRequest,
      defaultFileList,
      fileList,
      multiple,
      onChange,
      onRemove,
    });

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    const rawFiles = Array.from(event.dataTransfer.files ?? []);

    if (rawFiles.length === 0) {
      return;
    }

    await processFiles(rawFiles);
  }

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

      <div
        className={[
          "squid-upload-dragger",
          dragOver && "squid-upload-dragger-dragover",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node)) {
            return;
          }
          setDragOver(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
      >
        {children ?? (
          <>
            <div className="squid-upload-dragger-icon">
              <InboxIcon />
            </div>
            <div className="squid-upload-dragger-title">{title}</div>
            <div className="squid-upload-dragger-description">{description}</div>
          </>
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

              {typeof file.percent === "number" && file.status === "uploading" ? (
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
