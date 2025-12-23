"use client";

import { useEffect, useMemo, useState } from "react";

function StarIcon(props: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-4 w-4 ${props.filled ? "fill-amber-400" : "fill-zinc-300 dark:fill-zinc-700"}`}
    >
      <path d="M12 17.27l5.18 3.04-1.4-5.97L20.5 9.6l-6.08-.52L12 3.5 9.58 9.08 3.5 9.6l4.72 4.74-1.4 5.97L12 17.27z" />
    </svg>
  );
}

function HeartIcon(props: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-4 w-4 ${props.filled ? "fill-rose-500" : "fill-zinc-300 dark:fill-zinc-700"}`}
    >
      <path d="M12 21s-7.2-4.35-9.6-8.28C.69 9.78 2.08 6.6 5.4 6.06c1.86-.3 3.55.55 4.6 1.77 1.05-1.22 2.74-2.07 4.6-1.77 3.32.54 4.71 3.72 3 6.66C19.2 16.65 12 21 12 21z" />
    </svg>
  );
}

export function ProjectEngagement(props: {
  projectId: string;
  initialLikes: number;
  initialRatingCount: number;
  initialRatingSum: number;
}) {
  const [likes, setLikes] = useState(props.initialLikes);
  const [ratingCount, setRatingCount] = useState(props.initialRatingCount);
  const [ratingSum, setRatingSum] = useState(props.initialRatingSum);
  const [busy, setBusy] = useState(false);

  const avg = useMemo(() => (ratingCount ? ratingSum / ratingCount : 0), [ratingCount, ratingSum]);

  const likedKey = `project-liked:${props.projectId}`;
  const ratedKey = `project-rated:${props.projectId}`;

  const [liked, setLiked] = useState(false);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    setLiked(localStorage.getItem(likedKey) === "1");
    setRated(localStorage.getItem(ratedKey) === "1");
  }, [likedKey, ratedKey]);

  async function send(body: { like?: boolean; rating?: number }) {
    const res = await fetch("/api/projects/engagement", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId: props.projectId, ...body }),
    });

    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as
      | {
          project?: {
            likesCount: number;
            ratingCount: number;
            ratingSum: number;
          };
        }
      | null;

    return json?.project ?? null;
  }

  async function onLike() {
    if (busy || liked) return;
    setBusy(true);
    setLikes((v) => v + 1);
    setLiked(true);
    localStorage.setItem(likedKey, "1");

    const updated = await send({ like: true });
    if (updated) {
      setLikes(updated.likesCount);
      setRatingCount(updated.ratingCount);
      setRatingSum(updated.ratingSum);
    }

    setBusy(false);
  }

  async function onRate(stars: number) {
    if (busy || rated) return;
    setBusy(true);
    setRatingCount((v) => v + 1);
    setRatingSum((v) => v + stars);
    setRated(true);
    localStorage.setItem(ratedKey, "1");

    const updated = await send({ rating: stars });
    if (updated) {
      setLikes(updated.likesCount);
      setRatingCount(updated.ratingCount);
      setRatingSum(updated.ratingSum);
    }

    setBusy(false);
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onLike}
        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-zinc-200 bg-white/60 px-3 text-sm font-medium text-zinc-800 transition hover:bg-white disabled:opacity-60 dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
        disabled={busy || liked}
        aria-label="Like"
        title={liked ? "Liked" : "Like"}
      >
        <HeartIcon filled={liked} />
        <span>{likes}</span>
      </button>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1" aria-label="Rate">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onRate(n)}
              disabled={busy || rated}
              className="rounded-md p-1 disabled:opacity-60"
              aria-label={`Rate ${n} stars`}
              title={rated ? "Already rated" : `Rate ${n}`}
            >
              <StarIcon filled={avg >= n - 0.25} />
            </button>
          ))}
        </div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">
          {avg ? avg.toFixed(1) : "0.0"} ({ratingCount})
        </div>
      </div>
    </div>
  );
}
