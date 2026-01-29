import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    // Configuration UploadThing
    // Le token est automatiquement lu depuis UPLOADTHING_TOKEN
  },
});
