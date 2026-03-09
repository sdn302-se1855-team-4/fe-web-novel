"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Users, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import styles from "./profile.module.css";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  bio?: string;
  createdAt?: string;
}

interface FollowList {
  id: string;
  name: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [following, setFollowing] = useState<FollowList[]>([]);
  const [followers, setFollowers] = useState<FollowList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    Promise.all([
      apiFetch<UserProfile>("/auth/profile"),
      apiFetch<FollowList[] | { data: FollowList[] }>(
        "/follow/following",
      ).catch(() => []),
      apiFetch<FollowList[] | { data: FollowList[] }>(
        "/follow/followers",
      ).catch(() => []),
    ])
      .then(([profileData, followingData, followersData]) => {
        setProfile(profileData);
        setFollowing(
          Array.isArray(followingData)
            ? followingData
            : (followingData as { data: FollowList[] }).data || [],
        );
        setFollowers(
          Array.isArray(followersData)
            ? followersData
            : (followersData as { data: FollowList[] }).data || [],
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className={styles.profileCard}>
            <div
              className="skeleton"
              style={{ width: 100, height: 100, borderRadius: "50%" }}
            />
            <div className="skeleton" style={{ height: 28, width: 200 }} />
            <div className="skeleton" style={{ height: 16, width: 150 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className={styles.profileCard}>
          <div className={styles.avatar}>
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar}
                alt={profile.name}
                className={styles.avatarImg}
              />
            ) : (
              <User size={48} />
            )}
          </div>

          <h1 className={styles.name}>{profile.name}</h1>
          <p className={styles.email}>{profile.email}</p>
          <span
            className={`badge ${profile.role === "ADMIN" ? "badge-premium" : profile.role === "WRITER" ? "badge-primary" : "badge-success"}`}
          >
            {profile.role === "ADMIN"
              ? "Admin"
              : profile.role === "WRITER"
                ? "Tác giả"
                : "Độc giả"}
          </span>

          {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <Users size={18} />
              <span className={styles.statValue}>{following.length}</span>
              <span className={styles.statLabel}>Đang theo dõi</span>
            </div>
            <div className={styles.statItem}>
              <Users size={18} />
              <span className={styles.statValue}>{followers.length}</span>
              <span className={styles.statLabel}>Người theo dõi</span>
            </div>
            {profile.createdAt && (
              <div className={styles.statItem}>
                <Calendar size={18} />
                <span className={styles.statValue}>
                  {new Intl.DateTimeFormat("vi", {
                    month: "long",
                    year: "numeric",
                  }).format(new Date(profile.createdAt))}
                </span>
                <span className={styles.statLabel}>Tham gia</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
