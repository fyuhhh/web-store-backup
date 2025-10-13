"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RoleGuard({
  children,
  allowed,
}: {
  children: React.ReactNode;
  allowed?: string[];
}) {
  const router = useRouter();

  useEffect(() => {
    const userRaw = localStorage.getItem("userData");
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (
          user.role === "divisi" &&
          allowed &&
          !allowed.includes(window.location.pathname)
        ) {
          router.replace("/dashboard/rekap-full");
        }
      } catch {}
    }
  }, [allowed, router]);

  return <>{children}</>;
}
