"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, LogOut, MessageCircle, Settings, Terminal } from "lucide-react";
import { api } from "@/lib/api";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import CreateProjectDialog from "./CreateProjectDialog";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import { useChat } from "./ChatProvider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./ui/DropdownMenu";

export default function Navbar() {
  const router = useRouter();
  const { openChat } = useChat();
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await api.logout().catch(() => {});
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-1.5 font-display text-[15px] font-semibold text-ink">
          <Terminal className="size-[18px] text-accent" strokeWidth={2.25} aria-hidden />
          projectcollab
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user === undefined ? (
            <div className="h-9 w-24" />
          ) : user ? (
            <>
              <NotificationBell onOpenChat={openChat} />
              <Link
                href="/messages"
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-canvas hover:text-ink sm:flex"
              >
                <MessageCircle className="size-4" aria-hidden />
                Messages
              </Link>
              <CreateProjectDialog />
              <Link
                href="/saved"
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-canvas hover:text-ink sm:flex"
              >
                <Bookmark className="size-4" aria-hidden />
                Saved
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="ml-1 rounded-full transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                  <Avatar src={user.avatarUrl} alt={user.username} size="sm" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>@{user.username}</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/me">
                      <Settings className="size-4" aria-hidden />
                      Edit profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="sm:hidden">
                    <Link href="/messages">
                      <MessageCircle className="size-4" aria-hidden />
                      Messages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="sm:hidden">
                    <Link href="/saved">
                      <Bookmark className="size-4" aria-hidden />
                      Saved
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem danger onSelect={handleLogout}>
                    <LogOut className="size-4" aria-hidden />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button as={Link} href="/login" size="sm">
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
