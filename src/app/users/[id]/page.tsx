"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  User,
  BookOpen,
  Users,
  Calendar,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import StoryCard from "@/components/StoryCard";
import styles from "./profile.module.css";

interface ProfileData {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  role: string;
  createdAt: string;
  _count: { stories: number; following: number; followers: number };
  stories: Array<{
    id: string;
    title: string;
    coverImage?: string;
    description?: string;
    type?: string;
    status?: string;
    viewCount?: number;
    averageRating?: number;
    author?: {
      id: string;
      name?: string;
      displayName?: string;
      username?: string;
    };
    genres?: { id: string; name: string }[];
    _count?: { chapters: number };
  }>;
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setLoggedIn(isLoggedIn()));

    apiFetch<ProfileData>(`/users/${userId}/profile`)
      .then((data) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));

    if (isLoggedIn()) {
      apiFetch<{ isFollowing: boolean }>(`/follow/check/${userId}`)
        .then((res) => setFollowing(res.isFollowing))
        .catch(() => {});
    }
  }, [userId]);

  const toggleFollow = async () => {
    if (!loggedIn) return;
    try {
      if (following) {
        await apiFetch(`/follow/${userId}`, { method: "DELETE" });
        setFollowing(false);
        setProfile((p) =>
          p
            ? {
                ...p,
                _count: { ...p._count, followers: p._count.followers - 1 },
              }
            : p,
        );
      } else {
        await apiFetch(`/follow/${userId}`, { method: "POST" });
        setFollowing(true);
        setProfile((p) =>
          p
            ? {
                ...p,
                _count: { ...p._count, followers: p._count.followers + 1 },
              }
            : p,
        );
      }
    } catch {
      //
    }
  };

  if (loading) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.profileHeader}>
          <div
            className="skeleton"
            style={{ width: 96, height: 96, borderRadius: "50%" }}
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div className="skeleton" style={{ height: 28, width: 200 }} />
            <div className="skeleton" style={{ height: 16, width: 300 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.empty}>
          <User size={48} />
          <p>Không tìm thấy người dùng</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <div className={styles.avatarWrap}>
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar}
              alt={profile.displayName || profile.username}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarFallback}>
              <User size={40} />
            </div>
          )}
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.nameRow}>
            <h1 className={styles.name}>
              {profile.displayName || profile.username}
            </h1>
            <span className={styles.roleBadge}>{profile.role}</span>
          </div>
          <p className={styles.username}>@{profile.username}</p>
          {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
          <div className={styles.statsRow}>
            <span className={styles.stat}>
              <BookOpen size={14} /> {profile._count.stories} truyện
            </span>
            <span className={styles.stat}>
              <Users size={14} /> {profile._count.followers} người theo dõi
            </span>
            <span className={styles.stat}>
              <UserPlus size={14} /> {profile._count.following} đang theo dõi
            </span>
            <span className={styles.stat}>
              <Calendar size={14} /> Tham gia{" "}
              {new Date(profile.createdAt).toLocaleDateString("vi")}
            </span>
          </div>
          {loggedIn && (
            <button
              className={`btn ${following ? "btn-outline" : "btn-primary"} ${styles.followBtn}`}
              onClick={toggleFollow}
            >
              {following ? (
                <>
                  <UserMinus size={16} /> Đang theo dõi
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Theo dõi
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Stories */}
      {profile.stories.length > 0 && (
        <section className={styles.storiesSection}>
          <h2 className={styles.sectionTitle}>
            <BookOpen size={20} /> Truyện đã đăng ({profile.stories.length})
          </h2>
          <div className="grid-stories">
            {profile.stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
