import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
const sessionCookiePattern = /(?:^|;\s*)(?:__Secure-)?next-auth\.session-token(?:\.\d+)?=/i;

function normalizeSessionCookie(cookie: string) {
  if (!sessionCookiePattern.test(cookie)) {
    return cookie;
  }

  if (/;\s*max-age=0\b/i.test(cookie) || /=(?:;|$)/.test(cookie)) {
    return cookie;
  }

  return cookie.replace(/;\s*expires=[^;]+/gi, "").replace(/;\s*max-age=[^;]+/gi, "");
}

type AuthHandlerArgs = Parameters<typeof handler>;

async function authHandler(...args: AuthHandlerArgs) {
  const response = await handler(...args);
  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie") as string]
        : [];

  if (!setCookies.some((cookie: string) => sessionCookiePattern.test(cookie))) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.delete("set-cookie");

  for (const cookie of setCookies as string[]) {
    headers.append("set-cookie", normalizeSessionCookie(cookie));
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export { authHandler as GET, authHandler as POST };
