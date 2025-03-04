import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/prisma";
import Credentials from "@auth/core/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const { username, password } = credentials;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null;
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        let assignedCounterName = null;
        if (user.assignedCounterId) {
          const counter = await prisma.counter.findUnique({
            where: { id: user.assignedCounterId },
          });
          assignedCounterName = counter ? counter.name : null;
        }

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          username: user.username,
          role: user.role,
          assignedCounterName,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.assignedCounterName = user.assignedCounterName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.assignedCounterName = token.assignedCounterName as string;
      }
      return session;
    },
  },
});
