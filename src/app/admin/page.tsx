import { db } from "@/lib/db";
import { users, groupes, concerts } from "@/lib/db/schema";
import { count, eq, and, gte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Music2,
  CalendarDays,
  TrendingUp,
  UserPlus,
  Guitar,
} from "lucide-react";

async function getStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalGroupes,
    totalConcerts,
    newUsersThisMonth,
    organisateurs,
    groupeUsers,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(groupes),
    db.select({ count: count() }).from(concerts),
    db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo)),
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "ORGANISATEUR")),
    db.select({ count: count() }).from(users).where(eq(users.role, "GROUPE")),
  ]);

  return {
    totalUsers: totalUsers[0]?.count || 0,
    totalGroupes: totalGroupes[0]?.count || 0,
    totalConcerts: totalConcerts[0]?.count || 0,
    newUsersThisMonth: newUsersThisMonth[0]?.count || 0,
    organisateurs: organisateurs[0]?.count || 0,
    groupeUsers: groupeUsers[0]?.count || 0,
  };
}

async function getRecentUsers() {
  return db.query.users.findMany({
    orderBy: (users, { desc }) => [desc(users.createdAt)],
    limit: 5,
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
}

async function getRecentGroupes() {
  return db.query.groupes.findMany({
    orderBy: (groupes, { desc }) => [desc(groupes.createdAt)],
    limit: 5,
    columns: {
      id: true,
      nom: true,
      ville: true,
      isVerified: true,
      createdAt: true,
    },
  });
}

export default async function AdminDashboard() {
  const [stats, recentUsers, recentGroupes] = await Promise.all([
    getStats(),
    getRecentUsers(),
    getRecentGroupes(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord Admin</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de la plateforme
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Utilisateurs
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.organisateurs} organisateurs, {stats.groupeUsers} groupes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groupes</CardTitle>
            <Music2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGroupes}</div>
            <p className="text-xs text-muted-foreground">Profils de groupes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Concerts
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConcerts}</div>
            <p className="text-xs text-muted-foreground">Concerts créés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nouveaux (30j)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Nouveaux utilisateurs ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Derniers inscrits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-red-100 text-red-700"
                          : user.role === "GROUPE"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {user.role}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {user.createdAt?.toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent groups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Guitar className="h-5 w-5" />
              Derniers groupes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGroupes.map((groupe) => (
                <div
                  key={groupe.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{groupe.nom}</p>
                    <p className="text-sm text-muted-foreground">
                      {groupe.ville || "Ville non renseignée"}
                    </p>
                  </div>
                  <div className="text-right">
                    {groupe.isVerified ? (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                        Vérifié
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700">
                        Non vérifié
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {groupe.createdAt?.toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
