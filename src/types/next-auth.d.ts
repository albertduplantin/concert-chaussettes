import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "GROUPE" | "ORGANISATEUR" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    role: "GROUPE" | "ORGANISATEUR" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "GROUPE" | "ORGANISATEUR" | "ADMIN";
  }
}
