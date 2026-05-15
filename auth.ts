import NextAuth from "next-auth";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";

const { handlers: nextHandlers, auth: nextAuth, signIn: nextSignIn, signOut: nextSignOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { password } = parsedCredentials.data;
          const email = parsedCredentials.data.email.toLowerCase();
          
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;

          if (!user.isActive) return null;

          if (!user.passwordHash) return null;

          const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

          if (passwordsMatch) return user;
        }

        return null;
      },
    }),
  ],
});

export const handlers = nextHandlers;
export const auth = nextAuth;
export const signIn = nextSignIn;
export const signOut = nextSignOut;
