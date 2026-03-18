"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, getUserRole } from "@/lib/auth";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      // Small delay to ensure cookies are readable on first mount
      await Promise.resolve();

      const isAuth = isLoggedIn();
      const role = getUserRole();

      if (!isAuth) {
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (!role || !allowedRoles.includes(role)) {
        router.push("/");
        return;
      }

      setAuthorized(true);
    };

    handleAuth();
  }, [router, allowedRoles]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-vh-100">
        <div
          className="skeleton"
          style={{ width: 100, height: 100, borderRadius: "50%" }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
