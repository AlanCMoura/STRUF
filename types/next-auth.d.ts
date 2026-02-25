import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "customer" | "admin" | "manager";
  }

  interface Session {
    user: {
      id: string;
      role: "customer" | "admin" | "manager";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "customer" | "admin" | "manager";
  }
}
