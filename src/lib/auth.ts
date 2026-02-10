import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { users, accounts, groupes, organisateurs } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { Adapter, AdapterUser, AdapterAccount } from "next-auth/adapters";

export interface SessionUser {
  id: string;
  email: string;
  role: "GROUPE" | "ORGANISATEUR" | "ADMIN";
  name?: string | null;
  image?: string | null;
  needsOnboarding?: boolean;
}

export interface Session {
  user: SessionUser;
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
        columns: { id: true, email: true, emailVerified: true, name: true, image: true },
      });

      if (!user) return null;
      return user as AdapterUser;
    },

    async getUserByEmail(email) {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
        columns: { id: true, email: true, emailVerified: true, name: true, image: true },
      });

      if (!user) return null;
      return user as AdapterUser;
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const account = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.providerAccountId, providerAccountId),
          eq(accounts.provider, provider)
        ),
        columns: { userId: true },
      });

      if (!account) return null;

      const user = await db.query.users.findFirst({
        where: eq(users.id, account.userId),
        columns: { id: true, email: true, emailVerified: true, name: true, image: true },
      });

      if (!user) return null;
      return user as AdapterUser;
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
    async signIn() {
      // Toujours autoriser la connexion, l'onboarding est géré dans le JWT
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "ORGANISATEUR";
        token.name = user.name;
        token.image = user.image;
      }

      // Pour OAuth ou update, récupérer le rôle et vérifier l'onboarding avec une requête légère
      if ((account?.provider === "google" || trigger === "update") && token.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, token.email as string),
          columns: { id: true, role: true, passwordHash: true },
          with: {
            groupe: { columns: { id: true } },
            organisateur: { columns: { id: true } },
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.needsOnboarding = !dbUser.passwordHash && !dbUser.groupe && !dbUser.organisateur;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { needsOnboarding?: boolean }).needsOnboarding = token.needsOnboarding as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
});

/**
 * Récupère la session côté serveur en utilisant auth() de NextAuth.
 * Vérifie que l'utilisateur existe toujours en DB (évite les boucles de redirect sur JWT stale).
 * Requête minimale : SELECT id uniquement.
 */
export async function getSession(): Promise<Session | null> {
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }

  // Vérification légère : l'utilisateur existe-t-il encore en DB ?
  const userRow = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, session.user.email as string))
    .limit(1);

  if (!userRow.length) {
    return null;
  }

  // Utiliser l'ID et le rôle de la DB (pas du JWT) pour éviter les IDs stale entre migrations
  return {
    user: {
      id: userRow[0].id,
      email: session.user.email as string,
      role: userRow[0].role as "GROUPE" | "ORGANISATEUR" | "ADMIN",
      name: session.user.name,
      image: session.user.image,
      needsOnboarding: (session.user as { needsOnboarding?: boolean }).needsOnboarding || false,
    },
  };
}
