import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { MobileLessonPlayer } from "@/components/lesson/MobileLessonPlayer";
import { ContinueOnComputer } from "@/components/ContinueOnComputer";
import { getAllProgress, getLesson, isUnlockedOnPhone } from "@/lib/lessons";
import { setLockedFlash } from "@/lib/phone-lesson";
import { useIsPhone } from "@/hooks/use-is-phone";

export const Route = createFileRoute("/learn/$slug")({
  loader: ({ params }) => {
    const lesson = getLesson(params.slug);
    if (!lesson) throw notFound();
    return lesson;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Lesson"} — Stockify Learn` },
      { name: "description", content: loaderData?.blurb ?? "A Stockify lesson." },
      { property: "og:title", content: `${loaderData?.title ?? "Lesson"} — Stockify Learn` },
      { property: "og:description", content: loaderData?.blurb ?? "A Stockify lesson." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const lesson = Route.useLoaderData();
  const isPhone = useIsPhone();
  const navigate = useNavigate();
  const [phoneAccess, setPhoneAccess] = useState<"open" | "locked" | "computer" | null>(null);

  useEffect(() => {
    if (!isPhone) return setPhoneAccess(null);
    if (lesson.track) return setPhoneAccess("computer");
    if (isUnlockedOnPhone(lesson.slug, getAllProgress())) return setPhoneAccess("open");
    setPhoneAccess("locked");
    setLockedFlash();
    void navigate({ to: "/learn", replace: true });
  }, [isPhone, lesson, navigate]);

  // Desktop (and the server render) keep the existing player; phones switch once the screen size is known.
  return (
    <AppShell>
      {isPhone !== true && (
        <div className={isPhone === null ? "hidden md:block" : ""}>
          {/* Keyed so moving to the next lesson starts fresh instead of reusing quiz state. */}
          <LessonPlayer key={lesson.slug} lesson={lesson} />
        </div>
      )}
      {isPhone === null && <div className="h-96 md:hidden" aria-hidden />}
      {phoneAccess === "computer" && <ContinueOnComputer />}
      {phoneAccess === "open" && <MobileLessonPlayer key={lesson.slug} lesson={lesson} />}
    </AppShell>
  );
}
