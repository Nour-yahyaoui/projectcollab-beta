"use client";

import { useState } from "react";
import { Sparkles, AlertCircle } from "lucide-react";
import { CATEGORY_LIST } from "@/lib/categories";
import { Field, Input, Textarea } from "./ui/Field";
import Button from "./ui/Button";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";

export default function PostForm({ onSuccess }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("SHARE");
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [techStack, setTechStack] = useState("");
  const [contributorsNeeded, setContributorsNeeded] = useState(1);
  const [improving, setImproving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  async function handleImprove() {
    if (!description.trim()) return;
    setImproving(true);
    setErr(null);
    try {
      const { improved } = await api.improveDescription(description);
      setDescription(improved);
    } catch (e) {
      setErr(e.message);
    } finally {
      setImproving(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const post = await api.createPost({
        title,
        description,
        category,
        githubUrl: githubUrl || undefined,
        techStack: techStack
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        contributorsNeeded: category === "COLLAB" ? contributorsNeeded : 0,
      });
      onSuccess?.(post);
    } catch (e) {
      setErr(e.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {err && (
        <div className="flex items-start gap-2 rounded-lg bg-danger-light px-3.5 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{err}</span>
        </div>
      )}

      <Field label="Title" htmlFor="post-title">
        <Input
          id="post-title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Todo app with React"
        />
      </Field>

      <Field label="Category">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATEGORY_LIST.map((c) => {
            const Icon = c.icon;
            const selected = category === c.value;
            return (
              <button
                type="button"
                key={c.value}
                onClick={() => setCategory(c.value)}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-colors",
                  selected ? "border-accent bg-accent-light" : "border-border hover:border-border-strong hover:bg-canvas"
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-full",
                    selected ? "bg-accent text-white" : cn(c.bg, c.text)
                  )}
                >
                  <Icon className="size-4" strokeWidth={2.25} aria-hidden />
                </span>
                <span className={cn("text-xs font-medium", selected ? "text-accent-dark" : "text-ink")}>
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Description"
        htmlFor="post-description"
        action={
          <button
            type="button"
            onClick={handleImprove}
            disabled={improving || !description.trim()}
            className="flex items-center gap-1 text-xs font-medium text-accent transition-opacity hover:text-accent-dark disabled:opacity-40"
          >
            <Sparkles className="size-3.5" aria-hidden />
            {improving ? "Improving…" : "Improve with AI"}
          </button>
        }
      >
        <Textarea
          id="post-description"
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="This is a todo app with React"
        />
      </Field>

      <Field label="GitHub URL" hint="Optional" htmlFor="post-github">
        <Input
          id="post-github"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          className="font-mono"
          placeholder="https://github.com/you/repo"
        />
      </Field>

      <Field label="Tech stack" hint="Comma separated" htmlFor="post-tech">
        <Input
          id="post-tech"
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          className="font-mono"
          placeholder="React, TailwindCSS, Prisma"
        />
      </Field>

      {category === "COLLAB" && (
        <Field label="Contributors needed" htmlFor="post-contributors">
          <Input
            id="post-contributors"
            type="number"
            min={1}
            value={contributorsNeeded}
            onChange={(e) => setContributorsNeeded(Number(e.target.value))}
            className="w-28"
          />
        </Field>
      )}

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? "Publishing…" : "Publish project"}
      </Button>
    </form>
  );
}
