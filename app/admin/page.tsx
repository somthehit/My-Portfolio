"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  techStack: string[];
  order: number;
  isVisible: boolean;
  likesCount?: number;
  ratingCount?: number;
  ratingSum?: number;
  previewImage: string | null;
  previewTitle: string | null;
  previewDescription: string | null;
  previewDomain: string | null;
};

type VisitorLog = {
  id: string;
  path: string;
  referrer: string | null;
  country: string | null;
  city: string | null;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
};

type ContactMessage = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<"overview" | "resume" | "works" | "messages" | "settings">("overview");

  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);

  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [visitorLogsLoading, setVisitorLogsLoading] = useState(false);
  const [visitorQuery, setVisitorQuery] = useState("");

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [heroRolesText, setHeroRolesText] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [showAddWork, setShowAddWork] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [screenshotsUploading, setScreenshotsUploading] = useState(false);
  const [workSaving, setWorkSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");

  const techStackArray = useMemo(
    () => techStack.split(",").map((s) => s.trim()).filter(Boolean),
    [techStack]
  );

  function handleUnauthorized() {
    setLoggedIn(false);
    setProjects([]);
    setVisitorLogs([]);
    router.replace("/admin/login?next=/admin");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
    setProjects([]);
    setVisitorLogs([]);
    router.replace("/admin/login");
    router.refresh();
  }

  async function loadProjects() {
    const res = await fetch("/api/admin/projects", { cache: "no-store" });
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }
    if (!res.ok) return;
    const json = (await res.json()) as { projects: Project[] };
    setProjects(json.projects);
  }

  async function loadResume() {
    const res = await fetch("/api/admin/resume", { cache: "no-store" });
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }
    if (!res.ok) return;
    const json = (await res.json()) as { resumeUrl: string | null };
    setResumeUrl(json.resumeUrl);
  }

  async function loadVisitorLogs() {
    setVisitorLogsLoading(true);
    setError(null);

    const qs = new URLSearchParams();
    if (visitorQuery.trim()) qs.set("q", visitorQuery.trim());

    const res = await fetch(`/api/admin/visitor-logs?${qs.toString()}`, { cache: "no-store" }).catch(() => null);
    setVisitorLogsLoading(false);

    if (!res) {
      setError("Failed to load visitor logs");
      return;
    }

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    if (!res.ok) return;
    const json = (await res.json()) as { logs: VisitorLog[] };
    setVisitorLogs(json.logs);
  }

  async function loadMessages() {
    setMessagesLoading(true);
    setError(null);

    const res = await fetch("/api/admin/messages", { cache: "no-store" }).catch(() => null);
    setMessagesLoading(false);

    if (!res) {
      setError("Failed to load messages");
      return;
    }

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    if (!res.ok) return;
    const json = (await res.json()) as { messages: ContactMessage[] };
    setMessages(json.messages);
  }

  async function loadSettings() {
    setError(null);
    const res = await fetch("/api/admin/settings", { cache: "no-store" }).catch(() => null);

    if (!res) {
      setError("Failed to load settings");
      return;
    }

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    if (!res.ok) return;
    const json = (await res.json()) as { heroRoles: string[] };
    setHeroRolesText((json.heroRoles ?? []).join("\n"));
  }

  async function saveHeroRoles() {
    setError(null);
    setSettingsSaving(true);

    const heroRoles = heroRolesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ heroRoles }),
    }).catch(() => null);

    setSettingsSaving(false);

    if (!res) {
      setError("Failed to save settings");
      return;
    }

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(j?.error ?? "Failed to save settings");
      return;
    }
  }

  async function uploadResume(file: File) {
    setError(null);
    setResumeUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/admin/resume", {
      method: "POST",
      body: fd,
    });

    setResumeUploading(false);

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    if (!res.ok) {
      setError("Resume upload failed (check Supabase env + bucket permissions)");
      return;
    }

    const json = (await res.json()) as { resumeUrl?: string };
    setResumeUrl(json.resumeUrl ?? null);
  }

  async function createProject() {
    setError(null);
    const res = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        url,
        description: description || null,
        techStack: techStackArray,
      }),
    });

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    if (!res.ok) {
      setError("Create failed (check URL + server env)");
      return false;
    }

    setTitle("");
    setUrl("");
    setDescription("");
    setTechStack("");
    await loadProjects();

    return true;
  }

  async function updateProject(id: string) {
    setError(null);
    const res = await fetch("/api/admin/projects", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id,
        title,
        url,
        description: description || null,
        techStack: techStackArray,
      }),
    });

    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }

    if (!res.ok) {
      setError("Update failed (check URL + server env)");
      return false;
    }

    setEditingProjectId(null);
    setTitle("");
    setUrl("");
    setDescription("");
    setTechStack("");
    await loadProjects();
    return true;
  }

  async function uploadProjectScreenshots(projectId: string, files: File[]) {
    if (!files.length) return [] as string[];

    setScreenshotsUploading(true);
    setError(null);

    const fd = new FormData();
    for (const f of files) fd.append("files", f);

    const res = await fetch(`/api/admin/projects/screenshots?projectId=${encodeURIComponent(projectId)}`, {
      method: "POST",
      body: fd,
    }).catch(() => null);

    setScreenshotsUploading(false);

    if (!res) {
      setError("Screenshot upload failed");
      return null;
    }

    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }

    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string; details?: string } | null;
      setError(j?.details ? `${j?.error ?? "Upload failed"}: ${j.details}` : (j?.error ?? "Upload failed"));
      return null;
    }

    const json = (await res.json().catch(() => null)) as { urls?: string[] } | null;
    return Array.isArray(json?.urls) ? json!.urls! : [];
  }

  async function refreshPreview(id: string) {
    const res = await fetch("/api/admin/projects", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, refreshPreview: true }),
    });

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    if (!res.ok) {
      setError("Preview refresh failed");
      return;
    }

    await loadProjects();
  }

  async function deleteProject(id: string) {
    const res = await fetch("/api/admin/projects", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    if (!res.ok) {
      setError("Delete failed");
      return;
    }

    await loadProjects();
  }

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const res = await fetch("/api/admin/projects", { cache: "no-store" }).catch(() => null);
      if (cancelled) return;

      if (!res || res.status === 401) {
        setLoggedIn(false);
        router.replace("/admin/login?next=/admin");
        return;
      }

      setLoggedIn(true);
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!loggedIn) return;
    void loadProjects();
    void loadResume();
    void loadVisitorLogs();
    void loadMessages();
    void loadSettings();
  }, [loggedIn]);

  const filteredProjects = useMemo(() => {
    return projects;
  }, [projects]);

  const unreadMessages = useMemo(() => messages.filter((m) => !m.isRead).length, [messages]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute -bottom-48 right-[-160px] h-[560px] w-[560px] rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/10" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-medium text-zinc-700 backdrop-blur dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Admin Dashboard
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Overview</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Manage projects, resume, and visitor logs.</p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white/60 px-4 text-sm font-medium text-zinc-700 transition hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
            >
              Home
            </a>
            <button
              onClick={logout}
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white/60 px-4 text-sm font-medium text-zinc-700 transition hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
            >
              Logout
            </button>
          </div>
        </div>

        {loggedIn === null ? (
          <div className="mt-10 rounded-3xl border border-zinc-200 bg-white/70 p-6 backdrop-blur dark:border-zinc-800 dark:bg-black/30">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Checking session…</div>
          </div>
        ) : null}

        {loggedIn === true ? (
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <div className="rounded-3xl border border-zinc-200 bg-white/70 p-4 backdrop-blur dark:border-zinc-800 dark:bg-black/30">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setActiveView("overview")}
                    className={`inline-flex h-11 items-center justify-between rounded-2xl px-4 text-sm font-semibold transition ${
                      activeView === "overview"
                        ? "bg-zinc-950 text-white dark:bg-white dark:text-black"
                        : "border border-zinc-200 bg-white/60 text-zinc-800 hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
                    }`}
                  >
                    <span>Overview</span>
                  </button>

                  <button
                    onClick={() => setActiveView("resume")}
                    className={`inline-flex h-11 items-center justify-between rounded-2xl px-4 text-sm font-semibold transition ${
                      activeView === "resume"
                        ? "bg-zinc-950 text-white dark:bg-white dark:text-black"
                        : "border border-zinc-200 bg-white/60 text-zinc-800 hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
                    }`}
                  >
                    <span>Resume</span>
                  </button>

                  <button
                    onClick={() => setActiveView("works")}
                    className={`inline-flex h-11 items-center justify-between rounded-2xl px-4 text-sm font-semibold transition ${
                      activeView === "works"
                        ? "bg-zinc-950 text-white dark:bg-white dark:text-black"
                        : "border border-zinc-200 bg-white/60 text-zinc-800 hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
                    }`}
                  >
                    <span>Works</span>
                    <span className="text-xs font-medium opacity-70">{projects.length}</span>
                  </button>

                  <button
                    onClick={() => setActiveView("messages")}
                    className={`inline-flex h-11 items-center justify-between rounded-2xl px-4 text-sm font-semibold transition ${
                      activeView === "messages"
                        ? "bg-zinc-950 text-white dark:bg-white dark:text-black"
                        : "border border-zinc-200 bg-white/60 text-zinc-800 hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
                    }`}
                  >
                    <span>Message</span>
                    <span className="text-xs font-medium opacity-70">{unreadMessages}</span>
                  </button>

                  <button
                    onClick={() => setActiveView("settings")}
                    className={`inline-flex h-11 items-center justify-between rounded-2xl px-4 text-sm font-semibold transition ${
                      activeView === "settings"
                        ? "bg-zinc-950 text-white dark:bg-white dark:text-black"
                        : "border border-zinc-200 bg-white/60 text-zinc-800 hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
                    }`}
                  >
                    <span>Site Settings</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-9 space-y-6">
              {activeView === "overview" ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl border border-zinc-200 bg-white/70 p-5 backdrop-blur dark:border-zinc-800 dark:bg-black/30">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Projects</div>
                      <div className="mt-2 text-2xl font-semibold">{projects.length}</div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Total items in portfolio</div>
                    </div>
                    <div className="rounded-3xl border border-zinc-200 bg-white/70 p-5 backdrop-blur dark:border-zinc-800 dark:bg-black/30">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Resume</div>
                      <div className="mt-2 text-2xl font-semibold">{resumeUrl ? "Ready" : "None"}</div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Latest PDF upload status</div>
                    </div>
                    <div className="rounded-3xl border border-zinc-200 bg-white/70 p-5 backdrop-blur dark:border-zinc-800 dark:bg-black/30">
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Visitor logs</div>
                      <div className="mt-2 text-2xl font-semibold">{visitorLogs.length}</div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Recent entries loaded</div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-zinc-200 bg-white/70 p-6 backdrop-blur dark:border-zinc-800 dark:bg-black/30">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-base font-semibold">Visitor Logs</h2>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">See traffic events and basic metadata.</p>
                      </div>
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <input
                          value={visitorQuery}
                          onChange={(e) => setVisitorQuery(e.target.value)}
                          placeholder="Search path/referrer/ip"
                          className="h-10 w-full rounded-2xl border border-zinc-200 bg-white/70 px-4 text-sm outline-none ring-1 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-200 dark:border-zinc-800 dark:bg-black/30 dark:focus:border-emerald-900 dark:focus:ring-emerald-900/40 sm:w-64"
                        />
                        <button
                          onClick={loadVisitorLogs}
                          className="inline-flex h-10 items-center justify-center rounded-2xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                        >
                          {visitorLogsLoading ? "Loading…" : "Refresh"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-zinc-100/70 text-xs text-zinc-600 dark:bg-zinc-950/40 dark:text-zinc-400">
                            <tr>
                              <th className="px-4 py-3 font-medium">Time</th>
                              <th className="px-4 py-3 font-medium">Path</th>
                              <th className="px-4 py-3 font-medium">Referrer</th>
                              <th className="px-4 py-3 font-medium">Location</th>
                              <th className="px-4 py-3 font-medium">IP</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 bg-white/60 dark:divide-zinc-800 dark:bg-black/20">
                            {visitorLogs.length === 0 ? (
                              <tr>
                                <td className="px-4 py-4 text-zinc-600 dark:text-zinc-400" colSpan={5}>
                                  No logs yet.
                                </td>
                              </tr>
                            ) : (
                              visitorLogs.slice(0, 25).map((l) => (
                                <tr key={l.id} className="hover:bg-zinc-50/70 dark:hover:bg-white/5">
                                  <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                                    {new Date(l.createdAt).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 font-medium">{l.path}</td>
                                  <td className="px-4 py-3 max-w-[260px] truncate text-zinc-600 dark:text-zinc-400">
                                    {l.referrer ?? "—"}
                                  </td>
                                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                                    {[l.city, l.country].filter(Boolean).join(", ") || "—"}
                                  </td>
                                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{l.ip ?? "—"}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {activeView === "settings" ? (
                <div className="rounded-3xl border border-zinc-200 bg-white/70 p-6 backdrop-blur dark:border-zinc-800 dark:bg-black/30">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold">Hero Roles</h2>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">One role per line. This updates the homepage red role text.</p>
                    </div>
                    <button
                      onClick={saveHeroRoles}
                      className="inline-flex h-10 items-center justify-center rounded-2xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                      {settingsSaving ? "Saving…" : "Save"}
                    </button>
                  </div>

                  <textarea
                    value={heroRolesText}
                    onChange={(e) => setHeroRolesText(e.target.value)}
                    placeholder="Full Stack Developer\nUI/UX Designer\nProduct-focused Engineer"
                    className="mt-4 min-h-32 w-full rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 text-sm outline-none ring-1 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-200 dark:border-zinc-800 dark:bg-black/30 dark:focus:border-emerald-900 dark:focus:ring-emerald-900/40"
                  />
                </div>
              ) : null}

              {activeView === "resume" ? (
                <div className="rounded-3xl border border-zinc-200 bg-white/70 p-6 backdrop-blur dark:border-zinc-800 dark:bg-black/30">
                  <h2 className="text-base font-semibold">Resume</h2>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Upload a PDF. The homepage Resume button will always open the latest upload.
                  </p>

                  <div className="mt-4 flex flex-col gap-3">
                    <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-zinc-200 bg-white/60 px-5 text-sm font-semibold text-zinc-800 transition hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40">
                      {resumeUploading ? "Uploading…" : "Upload PDF"}
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        disabled={resumeUploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadResume(f);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>

                    {resumeUrl ? (
                      <a
                        href="/resume"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-400 px-5 text-sm font-semibold text-black shadow-[0_12px_40px_-18px_rgba(16,185,129,0.8)] transition hover:bg-emerald-300"
                      >
                        View Resume
                      </a>
                    ) : (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">No resume uploaded yet.</div>
                    )}
                  </div>
                </div>
              ) : null}

              {activeView === "works" ? (
                <>
                  <div className="rounded-3xl border border-zinc-200 bg-white/70 p-6 backdrop-blur dark:border-zinc-800 dark:bg-black/30">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-base font-semibold">Projects</h2>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowAddWork((v) => !v)}
                          className="inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white/60 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
                        >
                          {showAddWork ? "Close" : "Add Work"}
                        </button>
                        <button
                          onClick={loadProjects}
                          className="inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white/60 px-4 text-sm font-medium text-zinc-700 transition hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4">
                      {filteredProjects.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-3xl border border-zinc-200 bg-white/60 p-5 dark:border-zinc-800 dark:bg-black/20"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="text-base font-semibold">{p.title}</div>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">{p.previewDomain ?? p.url}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                              <div className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/60 px-3 py-1.5 text-xs dark:border-zinc-800 dark:bg-black/30">
                                <span className="text-zinc-500 dark:text-zinc-400">Likes</span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{p.likesCount ?? 0}</span>
                              </div>
                              <div className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/60 px-3 py-1.5 text-xs dark:border-zinc-800 dark:bg-black/30">
                                <span className="text-zinc-500 dark:text-zinc-400">Rating</span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {p.ratingCount ? ((p.ratingSum ?? 0) / p.ratingCount).toFixed(1) : "0.0"}
                                </span>
                                <span className="text-zinc-500 dark:text-zinc-400">({p.ratingCount ?? 0})</span>
                                <span className="inline-flex items-center gap-0.5" aria-label="Average rating">
                                  {Array.from({ length: 5 }).map((_, idx) => {
                                    const n = idx + 1;
                                    const avg = p.ratingCount ? (p.ratingSum ?? 0) / p.ratingCount : 0;
                                    const filled = avg >= n - 0.25;
                                    return (
                                      <svg
                                        key={n}
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                        className={`h-3.5 w-3.5 ${filled ? "fill-amber-400" : "fill-zinc-300 dark:fill-zinc-700"}`}
                                      >
                                        <path d="M12 17.27l5.18 3.04-1.4-5.97L20.5 9.6l-6.08-.52L12 3.5 9.58 9.08 3.5 9.6l4.72 4.74-1.4 5.97L12 17.27z" />
                                      </svg>
                                    );
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                setEditingProjectId(p.id);
                                setTitle(p.title);
                                setUrl(p.url);
                                setDescription(p.description ?? "");
                                setTechStack((p.techStack ?? []).join(", "));
                                setShowAddWork(true);
                              }}
                              className="inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white/60 px-4 text-sm font-medium text-zinc-700 transition hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => refreshPreview(p.id)}
                              className="inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white/60 px-4 text-sm font-medium text-zinc-700 transition hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
                            >
                              Refresh Preview
                            </button>
                            <button
                              onClick={() => deleteProject(p.id)}
                              className="inline-flex h-10 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-950/30"
                            >
                              Delete
                            </button>
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white/60 px-4 text-sm font-medium text-zinc-700 transition hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
                            >
                              Open Live
                            </a>
                          </div>
                          {!p.previewImage ? (
                            <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">No screenshot cached yet.</div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  {showAddWork ? (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center px-4"
                      role="dialog"
                      aria-modal="true"
                      onClick={() => setShowAddWork(false)}
                    >
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                      <div
                        className="relative w-full max-w-xl rounded-3xl border border-zinc-200 bg-white/95 p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950/90"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <h2 className="text-base font-semibold">{editingProjectId ? "Edit Work" : "Add Work"}</h2>
                          <button
                            onClick={() => {
                              setShowAddWork(false);
                              setEditingProjectId(null);
                              setError(null);
                              setTitle("");
                              setUrl("");
                              setDescription("");
                              setTechStack("");
                              setScreenshotFiles([]);
                            }}
                            className="inline-flex h-9 items-center justify-center rounded-2xl border border-zinc-200 bg-white/60 px-3 text-sm font-medium text-zinc-700 transition hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
                          >
                            Close
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4">
                          <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Project title"
                            className="h-11 rounded-2xl border border-zinc-200 bg-white/70 px-4 text-sm outline-none ring-1 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-200 dark:border-zinc-800 dark:bg-black/30 dark:focus:border-emerald-900 dark:focus:ring-emerald-900/40"
                          />
                          <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://project.com"
                            className="h-11 rounded-2xl border border-zinc-200 bg-white/70 px-4 text-sm outline-none ring-1 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-200 dark:border-zinc-800 dark:bg-black/30 dark:focus:border-emerald-900 dark:focus:ring-emerald-900/40"
                          />
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short description"
                            className="min-h-24 rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 text-sm outline-none ring-1 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-200 dark:border-zinc-800 dark:bg-black/30 dark:focus:border-emerald-900 dark:focus:ring-emerald-900/40"
                          />
                          <input
                            value={techStack}
                            onChange={(e) => setTechStack(e.target.value)}
                            placeholder="Tech stack (comma separated): Next.js, Prisma, Postgres"
                            className="h-11 rounded-2xl border border-zinc-200 bg-white/70 px-4 text-sm outline-none ring-1 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-200 dark:border-zinc-800 dark:bg-black/30 dark:focus:border-emerald-900 dark:focus:ring-emerald-900/40"
                          />

                          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-black/30">
                            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Screenshots (manual upload)</div>
                            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                              You can upload multiple images. These will be saved as this work’s screenshots.
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => setScreenshotFiles(Array.from(e.target.files ?? []))}
                              className="mt-3 block w-full text-sm text-zinc-700 file:mr-4 file:rounded-xl file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-900 dark:text-zinc-200 dark:file:bg-white dark:file:text-black dark:hover:file:bg-zinc-200"
                            />
                            {screenshotFiles.length ? (
                              <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                                {screenshotFiles.length} file(s) selected
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                          <button
                            onClick={async () => {
                              if (workSaving || screenshotsUploading) return;
                              setWorkSaving(true);
                              try {
                                const projectId = editingProjectId;

                                const ok = projectId ? await updateProject(projectId) : await createProject();
                                if (!ok) return;

                                const listRes = await fetch("/api/admin/projects", { cache: "no-store" });
                                if (listRes.status === 401) {
                                  handleUnauthorized();
                                  return;
                                }
                                const listJson = (await listRes.json().catch(() => null)) as { projects?: Project[] } | null;
                                const latestId = projectId ?? (listJson?.projects?.[0]?.id ?? null);
                                const targetId = latestId ?? projectId;
                                if (!targetId) {
                                  setShowAddWork(false);
                                  return;
                                }

                                if (screenshotFiles.length) {
                                  const urls = await uploadProjectScreenshots(targetId, screenshotFiles);
                                  if (!urls) return;

                                  const patchRes = await fetch("/api/admin/projects", {
                                    method: "PATCH",
                                    headers: { "content-type": "application/json" },
                                    body: JSON.stringify({ id: targetId, previewImages: urls }),
                                  });

                                  if (patchRes.status === 401) {
                                    handleUnauthorized();
                                    return;
                                  }

                                  if (!patchRes.ok) {
                                    setError("Failed to save screenshot URLs");
                                    return;
                                  }
                                }

                                setScreenshotFiles([]);
                                setShowAddWork(false);
                              } finally {
                                setWorkSaving(false);
                              }
                            }}
                            disabled={workSaving || screenshotsUploading}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-emerald-500 px-5 text-sm font-semibold text-white shadow-[0_12px_35px_-18px_rgba(168,85,247,0.65)] transition hover:from-fuchsia-500 hover:via-violet-500 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-[0_12px_35px_-18px_rgba(16,185,129,0.55)]"
                          >
                            {workSaving || screenshotsUploading ? (
                              <span
                                className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"
                                aria-hidden="true"
                              />
                            ) : null}
                            {workSaving || screenshotsUploading
                              ? "Saving…"
                              : (editingProjectId ? "Save Changes" : "Save & Generate Preview")}
                          </button>
                          {screenshotsUploading ? (
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">Uploading screenshots…</div>
                          ) : null}
                        </div>

                        {error ? (
                          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                            {error}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}

              {activeView === "messages" ? (
                <div className="rounded-3xl border border-zinc-200 bg-white/70 p-6 backdrop-blur dark:border-zinc-800 dark:bg-black/30">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-base font-semibold">Message</h2>
                    <button
                      onClick={loadMessages}
                      className="inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white/60 px-4 text-sm font-medium text-zinc-700 transition hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
                    >
                      {messagesLoading ? "Loading…" : "Refresh"}
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">No messages yet.</div>
                    ) : (
                      messages.slice(0, 50).map((m) => (
                        <div
                          key={m.id}
                          className="rounded-3xl border border-zinc-200 bg-white/60 p-5 dark:border-zinc-800 dark:bg-black/20"
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm font-semibold">
                              {m.name || "Unknown"}
                              {!m.isRead ? <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">Unread</span> : null}
                            </div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-400">
                              {new Date(m.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {m.email ? <span>{m.email}</span> : <span>—</span>}
                            {m.phone ? <span className="ml-3">{m.phone}</span> : null}
                          </div>
                          <div className="mt-3 whitespace-pre-wrap text-sm">{m.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
