import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { cache } from "react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const getCurrentUser = cache(async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({ where: { id: userId } });
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  return user;
}

export function buildAuthHref(nextPath?: string) {
  if (!nextPath) {
    return "/auth";
  }

  return `/auth?next=${encodeURIComponent(nextPath)}`;
}

export async function requirePageUser(nextPath: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(buildAuthHref(nextPath));
  }

  return user;
}
