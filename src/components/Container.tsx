import React from "react";

type ContainerProps = {
  children?: React.ReactNode;
};

export default function Container({
  children,
}: ContainerProps) {
  return (
    <div className=" h-[100vh] ">
        {children}
      </div>
  );
}
