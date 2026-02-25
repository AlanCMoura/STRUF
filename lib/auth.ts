import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { getLogger } from "@/lib/logger";

type DbUser = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "customer" | "admin" | "manager";
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const log = getLogger();
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (!email || !password) {
          log.warn({ email }, "Login invalido: credenciais ausentes");
          return null;
        }

        const result = await query<DbUser>(
          `SELECT id, name, email, password, role FROM users WHERE email = $1`,
          [email]
        );
        const user = result.rows[0];

        if (!user) {
          log.warn({ email }, "Login invalido: usuario nao encontrado");
          return null;
        }

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
          log.warn({ userId: user.id }, "Login invalido: senha incorreta");
          return null;
        }

        log.info({ userId: user.id, role: user.role }, "Login realizado");
        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if (
          user.role === "customer" ||
          user.role === "admin" ||
          user.role === "manager"
        ) {
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "customer" | "admin";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
