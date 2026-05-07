import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";

const { handlers: nextHandlers, auth: nextAuth, signIn: nextSignIn, signOut: nextSignOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
});

export const handlers = nextHandlers;
export const auth = nextAuth;
export const signIn = nextSignIn;
export const signOut = nextSignOut;
