import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
  type: ReactNode;
  onClick: () => void;
}

const Button = ({ children, type, onClick }: Props) => {
  return (
    <button className={"" + type} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
