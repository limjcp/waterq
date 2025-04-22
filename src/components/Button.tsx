import React from "react";

type ButtonProps = {
    onClick: () => void;
    children: React.ReactNode;
    size?: number;
    variant?: string
}

export default function Button({ children, onClick, size, variant }: ButtonProps) {
    return (
        <>
            <button
                onClick={onClick}
                className={`font-medium px-4 py-2 rounded-lg transition-colors flex items-center ${variant === "primary" ? "bg-blue-500 text-white" : variant === "danger" ? "bg-red-500" : "bg-black"} ${size === 20 ? `h-20` : `h-10`}`}
            >
                {children}
            </button>
        </>
    );
}
