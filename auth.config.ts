import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Providers added in auth.ts to avoid Edge issues with Prisma
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      
      // CRITICAL: Remove large fields to prevent "Session cookie exceeds allowed 4096 bytes" error.
      // This happens if a user has a massive base64 image stored in their profile.
      if (token.picture) delete token.picture;
      if (token.image) delete token.image;
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
