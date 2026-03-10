"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    apiFetch<{ id: string }>("/auth/profile")
      .then((user) => {
        router.replace(`/users/${user.id}`);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "50vh",
        color: "var(--text-secondary)",
      }}
    >
      <p>Đang chuyển hướng đến hồ sơ của bạn...</p>
    </div>
  );
}
