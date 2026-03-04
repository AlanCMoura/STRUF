"use client";

import { signOut } from "next-auth/react";
import type { ReactNode } from "react";

type SignOutButtonProps = {
  className?: string;
  callbackUrl?: string;
  children: ReactNode;
};

export default function SignOutButton({
  className,
  callbackUrl = "/",
  children,
}: SignOutButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void signOut({ callbackUrl });
      }}
    >
      {children}
    </button>
  );
}
