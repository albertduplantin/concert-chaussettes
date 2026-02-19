import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://concert-chaussettes.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/groupes", "/groupes/", "/concert/"],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/onboarding/",
          "/inscription/",
          "/avis/",
          "/import-contacts/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
