"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "./ui/Dialog";
import Button from "./ui/Button";
import PostForm from "./PostForm";

export default function CreateProjectDialog({ trigger }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleSuccess(post) {
    setOpen(false);
    router.push(`/post/${post.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        title="New project"
        description="Share what you're building, selling, or looking for collaborators on."
        className="max-w-lg"
      >
        <PostForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
