"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";

export default function MyProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState("");
  const [techStack, setTechStack] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((u) => {
        setUser(u);
        setBio(u.bio || "");
        setTechStack((u.techStack || []).join(", "));
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await api.updateUser(user.id, {
      bio,
      techStack: techStack.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg">
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-7">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="mt-5 h-20 w-full" />
          <Skeleton className="mt-5 h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Avatar src={user.avatarUrl} alt={user.username} size="lg" />
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Edit profile</h1>
          <p className="text-sm text-ink-soft">@{user.username}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-7"
      >
        <Field label="Username" htmlFor="username" hint="Synced from your sign-in provider">
          <Input id="username" disabled value={user.username} className="bg-canvas font-mono text-ink-soft" />
        </Field>

        <Field label="Bio" htmlFor="bio">
          <Textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Backend-leaning full-stack dev, into distributed systems."
          />
        </Field>

        <Field label="Tech stack" hint="Comma separated" htmlFor="tech">
          <Input
            id="tech"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            className="font-mono"
            placeholder="TypeScript, Go, Postgres"
          />
        </Field>

        <Button type="submit" size="lg" loading={saving} className="w-full">
          {saving ? "Saving…" : saved ? (
            <>
              <Check className="size-4" aria-hidden /> Saved
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </form>
    </div>
  );
}
