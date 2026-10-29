import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { getLesson } from "@/lib/lessons";

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
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const lesson = Route.useLoaderData();
  return (
    <AppShell>
      {/* Keyed so moving to the next lesson starts fresh instead of reusing quiz state. */}
      <LessonPlayer key={lesson.slug} lesson={lesson} />
    </AppShell>
  );
}
