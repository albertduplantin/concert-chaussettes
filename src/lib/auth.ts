import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { users, accounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { Adapter, AdapterUser, AdapterAccount } from "next-auth/adapters";

const jwtSecret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret"
);

export interface SessionUser {
  id: string;
  email: string;
  role: "GROUPE" | "ORGANISATEUR" | "ADMIN";
  name?: string | null;
  image?: string | null;
}

export interface Session {
  user: SessionUser;
}

/**
 * Custom getSession() - décoder le JWT jose côté serveur.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authjs.session-token")?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, jwtSecret);

    return {
      user: {
        id: (payload.id || payload.sub) as string,
        email: payload.email as string,
        role: payload.role as "GROUPE" | "ORGANISATEUR" | "ADMIN",
        name: payload.name as string | null,
        image: payload.image as string | null,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Custom minimal adapter for Drizzle with our schema
 */
function createDrizzleAdapter(): Adapter {
  return {
    async createUser(data) {
      const [user] = await db
        .insert(users)
        .values({
          email: data.email,
          name: data.name,
          image: data.image,
          emailVerified: data.emailVerified,
          role: "ORGANISATEUR", // Default role for OAuth users
        })
        .returning();

      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        image: user.image,
      } as AdapterUser;
    },

    async getUser(id) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        image: user.image,
      } as AdapterUser;
    },

    async getUserByEmail(email) {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        image: user.image,
      } as AdapterUser;
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const account = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.providerAccountId, providerAccountId),
          eq(accounts.provider, provider)
        ),
      });

      if (!account) return null;

      const user = await db.query.users.findFirst({
        where: eq(users.id, account.userId),
      });

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        image: user.image,
      } as AdapterUser;
    },

    async updateUser(data) {
      if (!data.id) throw new Error("User ID required");

      const [user] = await db
        .update(users)
        .set({
          email: data.email,
          name: data.name,
          image: data.image,
          emailVerified: data.emailVerified,
        })
        .where(eq(users.id, data.id))
        .returning();

      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        image: user.image,
      } as AdapterUser;
    },

    async linkAccount(data) {
      await db.insert(accounts).values({
        userId: data.userId,
        type: data.type,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        refresh_token: data.refresh_token,
        access_token: data.access_token,
        expires_at: data.expires_at,
        token_type: data.token_type,
        scope: data.scope,
        id_token: data.id_token,
        session_state: data.session_state as string | undefined,
      });

      return data as AdapterAccount;
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await db
        .delete(accounts)
        .where(
          and(
            eq(accounts.providerAccountId, providerAccountId),
            eq(accounts.provider, provider)
          )
        );
    },

    // We don't use database sessions, so these are no-ops
    async createSession() {
      throw new Error("Database sessions not supported");
    },
    async getSessionAndUser() {
      throw new Error("Database sessions not supported");
    },
    async updateSession() {
      throw new Error("Database sessions not supported");
    },
    async deleteSession() {
      throw new Error("Database sessions not supported");
    },
    async createVerificationToken() {
      return null;
    },
    async useVerificationToken() {
      return null;
    },
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: createDrizzleAdapter(),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "ORGANISATEUR";
        token.name = user.name;
        token.image = user.image;
      }

      // Pour OAuth, récupérer le rôle depuis la DB
      if (account?.provider === "google" && token.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, token.email as string),
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
