import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorized",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();

    const { has, orgId } = await auth();

    // 1. Check if the user is in the authorized organization (if configured)
    if (
      process.env.CLERK_AUTHORIZED_ORG_ID &&
      orgId !== process.env.CLERK_AUTHORIZED_ORG_ID
    ) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // 2. Check if the user has the 'org:admin' role within that organization
    if (!has({ role: "org:admin" })) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
