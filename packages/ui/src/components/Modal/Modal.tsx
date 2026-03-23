import "./style.css";
import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import Button from "../Button";

type ClosableConfig =
  | boolean
  | {
      "aria-label"?: string;
    };

type ModalMask = "blur" | "dimmed" | "none";

type ModalProps = {
  title?: ReactNode;
  open?: boolean;
  width?: number | string;
  mask?: ModalMask;
  centered?: boolean;
  style?: CSSProperties;
  closable?: ClosableConfig;
  children?: ReactNode;
  okText?: ReactNode;
  cancelText?: ReactNode;
  onOk?: () => void;
  onCancel?: () => void;
};

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      viewBox="0 0 14 14"
      width="1em"
    >
      <path
        d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function Modal({
  title,
  open = false,
  width = 520,
  mask = "dimmed",
  centered = false,
  style,
  closable = true,
  children,
  okText = "OK",
  cancelText = "Cancel",
  onOk,
  onCancel,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onCancel, open]);

  if (!open) {
    return null;
  }

  const closeButtonProps =
    closable && typeof closable === "object" ? closable : undefined;
  const showCloseButton = closable !== false;
  const modalStyle: CSSProperties = {
    top: centered ? undefined : 100,
    width: typeof width === "number" ? `${width}px` : width,
    ...style,
  };

  return createPortal(
    <div className="squid-modal-root" role="presentation">
      <div
        className={["squid-modal-mask", `squid-modal-mask-${mask}`].join(" ")}
        onClick={onCancel}
      />
      <div
        className={[
          "squid-modal-wrap",
          centered && "squid-modal-wrap-centered",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          aria-modal="true"
          className="squid-modal"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          style={modalStyle}
        >
          <div className="squid-modal-header">
            <div className="squid-modal-title">{title}</div>
            {showCloseButton ? (
              <button
                aria-label={closeButtonProps?.["aria-label"] ?? "Close"}
                className="squid-modal-close"
                onClick={onCancel}
                type="button"
              >
                <CloseIcon />
              </button>
            ) : null}
          </div>

          <div className="squid-modal-body">{children}</div>

          <div className="squid-modal-footer">
            <Button onClick={onCancel} type="default">
              {cancelText}
            </Button>
            <Button onClick={onOk} type="primary">
              {okText}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
