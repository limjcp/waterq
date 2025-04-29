import React from "react";

type ButtonProps = {
  onClick: (
    e: React.MouseEvent<HTMLButtonElement>
  ) => void;
  children?: React.ReactNode;
  size?: string;
  variant?: string;
  disabled?: boolean;
  withShortcut?: boolean;
  shortcutKey?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
};

export default function Button({
  children,
  onClick,
  size = "md",
  variant = "primary",
  disabled = false,
  withShortcut = false,
  shortcutKey,
  className = "",
  type = "button",
}: ButtonProps) {
  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!disabled) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
                font-medium rounded-lg transition-colors relative
                ${
                  variant === "outline"
                    ? "border-2 border-blue-600 bg-blue-200 hover:bg-blue-300 active:bg-blue-400 text-blue-600"
                    : ""
                }
                ${
                  variant === "primary"
                    ? "bg-sky-500 text-white hover:bg-sky-600 active:bg-sky-700"
                    : ""
                }
                ${
                  variant === "secondary"
                    ? "bg-cyan-600 text-white hover:bg-cyan-700 active:bg-cyan-800"
                    : ""
                }
                ${
                  variant === "danger"
                    ? "bg-red-500 text-white hover:bg-red-600 active:bg-red-700"
                    : ""
                }
                ${
                  variant === "success"
                    ? "bg-green-500 text-white hover:bg-green-600 active:bg-green-700"
                    : ""
                }
                ${
                  variant === "warning"
                    ? "bg-amber-600 text-white hover:bg-amber-700 hover:text-white active:bg-amber-700"
                    : ""
                }
                ${
                  size === "sm"
                    ? "px-2 py-1 text-sm"
                    : ""
                }
                ${
                  size === "md" ? "px-4 py-2" : ""
                }
                ${
                  size === "lg"
                    ? "px-6 py-3 text-lg"
                    : ""
                }
                ${
                  disabled
                    ? "opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400"
                    : ""
                }
                ${className}
            `}
    >
      <div className="flex items-center justify-center gap-2">
        {children}
        {withShortcut && shortcutKey && (
          <span
            className={`
                        text-lg px-1.5 py-0.5 rounded absolute right-2 top-1/2 transform -translate-y-1/2
                        ${
                          variant === "primary"
                            ? "bg-sky-700"
                            : ""
                        }
                        ${
                          variant === "secondary"
                            ? "bg-cyan-800"
                            : ""
                        }
                        ${
                          variant === "danger"
                            ? "bg-red-700"
                            : ""
                        }
                        ${
                          variant === "success"
                            ? "bg-green-700"
                            : ""
                        }
                        ${
                          variant === "warning"
                            ? "bg-amber-700 text-white"
                            : ""
                        }
                    `}
          >
            {shortcutKey}
          </span>
        )}
      </div>
    </button>
  );
}
