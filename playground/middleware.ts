import {
  MiddlewareConfig,
  NextResponse,
  type NextMiddleware,
} from "next/server";

import { getSession } from "./lib/data";

export default (async (req) => {
  if (req.nextUrl.pathname !== "/") {
    const sesh = await getSession();
    if (!sesh) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}) satisfies NextMiddleware;

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
} satisfies MiddlewareConfig;