import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";

const { handlers: nextHandlers, auth: nextAuth, signIn: nextSignIn, signOut: nextSignOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.passwordHash) return null;

          const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

          if (passwordsMatch) return user;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});

export const handlers = nextHandlers;
export const auth = nextAuth;
export const signIn = nextSignIn;
export const signOut = nextSignOut;
