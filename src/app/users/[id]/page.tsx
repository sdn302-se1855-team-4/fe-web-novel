"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  BookOpen,
  Users,
  Calendar,
  UserPlus,
  UserMinus,
  ChevronLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import StoryCard from "@/components/StoryCard";

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
    rating?: number;
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
  const router = useRouter();
  const userId = params.id as string;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

      // Get current user ID to hide follow button on own profile
      apiFetch<{ id: string }>("/users/me")
        .then((res) => setCurrentUserId(res.id))
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
      <div className="container py-8">
        <div className="flex flex-col items-center gap-6 text-center mb-8 p-12 bg-surface-brand border border-border-brand rounded-3xl shadow-lg relative overflow-hidden flex-col md:flex-row md:text-left md:p-12 md:gap-8">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
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
            className="items-center md:items-start"
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
      <div className="container py-8">
        <div className="flex flex-col items-center gap-4 py-24 text-text-muted text-center">
          <User size={48} />
          <p>Không tìm thấy người dùng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper min-h-screen bg-bg-brand overflow-x-hidden">
      {/* decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10 pt-10">
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-muted hover:text-emerald-500 transition-colors font-bold text-sm group"
          >
            <div className="p-2 rounded-full bg-surface-elevated/80 backdrop-blur-sm group-hover:bg-emerald-500/10 border border-border-brand/40 transition-colors">
              <ChevronLeft size={16} />
            </div>
            Quay lại
          </button>
        </div>

        {/* Profile Header card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-brand/40 backdrop-blur-md border border-border-brand/50 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row gap-8 items-center md:items-start"
        >
          {/* Avatar Area */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-emerald-500/30 p-1 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 shadow-2xl">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar} alt={profile.displayName || profile.username} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full bg-surface-elevated flex items-center justify-center text-primary-brand rounded-full">
                  <User size={48} />
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Info Area */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-black text-text-primary tracking-tight">
                {profile.displayName || profile.username}
              </h1>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-full text-[10px] font-black tracking-wider uppercase">
                {profile.role}
              </span>
            </div>
            
            <p className="text-sm font-bold text-slate-500 mb-4">@{profile.username}</p>
            
            {profile.bio && (
              <p className="text-text-secondary text-sm md:max-w-xl leading-relaxed mb-6 mx-auto md:mx-0">
                {profile.bio}
              </p>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-surface-elevated/40 backdrop-blur-sm border border-border-brand/30 rounded-2xl max-w-2xl mx-auto md:mx-0">
              <div className="flex flex-col items-center">
                <span className="text-xl font-black text-text-primary">{profile._count.stories}</span>
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Truyện</span>
              </div>
              <div className="flex flex-col items-center border-l border-border-brand/20">
                <span className="text-xl font-black text-text-primary">{profile._count.followers}</span>
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Người theo dõi</span>
              </div>
              <div className="flex flex-col items-center border-l border-border-brand/20">
                <span className="text-xl font-black text-text-primary">{profile._count.following}</span>
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Đang theo</span>
              </div>
              <div className="flex flex-col items-center border-l border-border-brand/20">
                <span className="text-xl font-black text-text-primary">
                  {new Date(profile.createdAt).toLocaleDateString("vi", { year: 'numeric', month: 'short' })}
                </span>
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Tham gia</span>
              </div>
            </div>

            {/* Action Group */}
            {loggedIn && currentUserId !== userId && (
              <div className="mt-6 flex justify-center md:justify-start">
                <button
                  onClick={toggleFollow}
                  className={`h-11 px-8 rounded-xl font-black uppercase tracking-wider text-sm shadow-lg gap-2 flex items-center justify-center transition-all hover:scale-[1.02] border ${
                    following 
                      ? "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 bg-transparent"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 border-transparent"
                  }`}
                >
                  {following ? <UserMinus size={18} /> : <UserPlus size={18} />}
                  {following ? "Đang theo dõi" : "Theo dõi"}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stories Listing */}
        {profile.stories.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <BookOpen size={20} />
              </div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">
                Truyện đã đăng <span className="text-emerald-500">({profile.stories.length})</span>
              </h2>
            </div>
            
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-10"
            >
              {profile.stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </motion.div>
          </section>
        )}
      </div>
    </div>
  );
}
