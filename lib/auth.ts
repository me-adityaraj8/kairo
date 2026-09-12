import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const ATTRIBUTES = ["Intellect", "Strength", "Discipline", "Vitality"];

/** Only offer a provider when it is actually configured. */
export const oauthEnabled = {
  google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
};

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() },
      });
      // OAuth-only accounts have no password to compare against
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, email: user.email, name: user.displayName };
    },
  }),
];

if (oauthEnabled.google) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

if (oauthEnabled.github) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers,
  callbacks: {
    /**
     * OAuth sign-in has no adapter, so the account is provisioned here:
     * create the user plus their starting attributes and companion, exactly
     * like credentials registration does.
     */
    async signIn({ user, account, profile }) {
      if (!account || account.provider === "credentials") return true;

      const email = user.email?.toLowerCase();
      if (!email) return false;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { image: user.image ?? existing.image },
        });
        return true;
      }

      const displayName =
        user.name?.trim().slice(0, 40) ||
        (profile as { login?: string })?.login?.slice(0, 40) ||
        email.split("@")[0].slice(0, 40);

      await prisma.user.create({
        data: {
          email,
          displayName,
          image: user.image ?? null,
          provider: account.provider,
          attributes: { create: ATTRIBUTES.map((name) => ({ name })) },
          companion: { create: {} },
        },
      });

      return true;
    },

    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;

      // OAuth users get their id resolved from the row created above
      if (!token.id && token.email) {
        const row = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() },
          select: { id: true },
        });
        if (row) token.id = row.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
};
