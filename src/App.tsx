import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Activity, ArrowRight, ArrowUpRight, Bell, CalendarDays, ChevronDown,
  CircleHelp, Clock3, FileImage, Home, Instagram, LayoutGrid, Link2,
  LoaderCircle, LogOut, Menu, MessageSquareText, Plus, Send, Settings2,
  ShieldCheck, Sparkles, WandSparkles
} from "lucide-react";
import { ID } from "appwrite";
import type { Models } from "appwrite";
import { account, appwriteConfigured, appwriteConfigurationHint } from "./lib/appwrite";

type AuthMode = "login" | "signup";
type Notice = { kind: "error" | "success" | "info"; text: string };

const navItems = [
  { label: "Overview", icon: Home },
  { label: "Content studio", icon: WandSparkles, tag: "AI" },
  { label: "Calendar", icon: CalendarDays },
  { label: "Social accounts", icon: Link2 },
  { label: "Ideas & trends", icon: Sparkles },
  { label: "Analytics", icon: Activity }
];

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Something went wrong. Please try again.";
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: Models.User<Models.Preferences>) => void }) {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!appwriteConfigured) {
      setNotice({ kind: "info", text: appwriteConfigurationHint() });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      if (mode === "signup") {
        await account.create({ userId: ID.unique(), email, password, name: name.trim() });
      }
      await account.createEmailPasswordSession({ email, password });
      const user = await account.get();
      onAuthenticated(user);
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-showcase">
        <a className="brand-lockup" href="#home" aria-label="POSTFLOW AI home">
          <span className="brand-mark"><Send size={19} /></span>
          <span>postflow<span className="brand-ai">.ai</span></span>
        </a>
        <div className="showcase-copy">
          <span className="eyebrow"><Sparkles size={14} /> YOUR SOCIAL WORKSPACE</span>
          <h1>Your ideas deserve<br /><span>to be seen.</span></h1>
          <p>Create thoughtful content, keep your channels organised and plan your next move from one calm workspace.</p>
          <div className="showcase-points">
            <div><span className="point-icon"><WandSparkles size={16} /></span><span><b>Make content</b><small>Turn a thought into a polished post.</small></span></div>
            <div><span className="point-icon"><CalendarDays size={16} /></span><span><b>Plan ahead</b><small>Keep your publishing calendar in view.</small></span></div>
            <div><span className="point-icon"><Activity size={16} /></span><span><b>Learn what works</b><small>Build a clearer picture of your content.</small></span></div>
          </div>
        </div>
        <div className="showcase-foot"><span>POSTFLOW AI</span><span>CREATE · PLAN · GROW</span></div>
      </section>

      <section className="auth-panel">
        <div className="auth-topline"><span>WELCOME TO POSTFLOW</span><span className="secure-label"><ShieldCheck size={14} /> Secure workspace</span></div>
        <div className="auth-card">
          <div className="mobile-brand brand-lockup"><span className="brand-mark"><Send size={18} /></span><span>postflow<span className="brand-ai">.ai</span></span></div>
          <span className="eyebrow auth-eyebrow">{mode === "signup" ? "GET STARTED" : "WELCOME BACK"}</span>
          <h2>{mode === "signup" ? "Create your account" : "Sign in to your space"}</h2>
          <p className="auth-subtitle">{mode === "signup" ? "A more organised way to show up online starts here." : "Pick up where your content journey paused."}</p>

          <div className="auth-switch" role="tablist" aria-label="Account access">
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setNotice(null); }}>Create account</button>
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setNotice(null); }}>Sign in</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === "signup" && <label>Full name<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required minLength={2} /></label>}
            <label>Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
            <label>Password<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} /></label>
            {notice && <div className={`notice notice-${notice.kind}`} role="alert">{notice.text}</div>}
            <button className="primary-button auth-submit" type="submit" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={17} /> : null}
              {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="auth-terms">By continuing, you agree to use POSTFLOW AI responsibly and follow the terms and policies of connected social platforms.</p>
        </div>
        <div className="auth-bottom"><span>© 2026 POSTFLOW AI</span><a href="mailto:support@postflow.ai"><CircleHelp size={14} /> Need help?</a></div>
      </section>
    </main>
  );
}

function Dashboard({ user, onSignOut }: { user: Models.User<Models.Preferences>; onSignOut: () => void }) {
  const [active, setActive] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const firstName = user.name?.trim().split(" ")[0] || "there";
  const initials = (user.name || user.email).slice(0, 1).toUpperCase();

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <a className="brand-lockup sidebar-brand" href="#overview"><span className="brand-mark"><Send size={18} /></span><span>postflow<span className="brand-ai">.ai</span></span></a>
        <div className="workspace-switch"><span className="workspace-avatar">P</span><span><b>Personal workspace</b><small>Free workspace</small></span><ChevronDown size={15} /></div>
        <span className="nav-caption">WORKSPACE</span>
        <nav className="main-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return <button key={item.label} className={active === item.label ? "nav-item selected" : "nav-item"} onClick={() => { setActive(item.label); setSidebarOpen(false); }}><Icon size={18} /><span>{item.label}</span>{item.tag && <span className="nav-tag">{item.tag}</span>}</button>;
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help"><div className="help-icon"><MessageSquareText size={17} /></div><b>Need a hand?</b><p>We're building a simpler way to manage your social presence.</p><a href="mailto:support@postflow.ai">Contact support <ArrowRight size={13} /></a></div>
        <button className="nav-item settings-link" onClick={() => setActive("Settings")}><Settings2 size={18} /><span>Settings</span></button>
        <div className="sidebar-user"><span className="user-avatar">{initials}</span><span className="user-details"><b>{user.name || "Your account"}</b><small>{user.email}</small></span><button className="icon-button signout" onClick={onSignOut} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><b>{active}</b></div>
          <div className="topbar-actions"><span className="status-pill"><span /> All systems ready</span><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button><span className="top-avatar">{initials}</span></div>
        </header>

        <div className="page-content">
          {active === "Overview" ? (
            <>
              <section className="welcome-row"><div><span className="eyebrow">YOUR CONTENT COMMAND CENTRE</span><h1>Good day, {firstName} <span className="wave">✦</span></h1><p>Here's the space where your next great post begins.</p></div><button className="primary-button" onClick={() => setActive("Content studio")}><Plus size={17} /> Create a post</button></section>
              <section className="stats-grid">
                <article className="stat-card"><div className="stat-top"><span>Posts published</span><span className="stat-icon lavender"><Send size={17} /></span></div><strong>0</strong><small><span className="muted-dot" /> Ready for your first post</small></article>
                <article className="stat-card"><div className="stat-top"><span>Scheduled posts</span><span className="stat-icon blue"><CalendarDays size={17} /></span></div><strong>0</strong><small><span className="muted-dot" /> Your calendar is clear</small></article>
                <article className="stat-card"><div className="stat-top"><span>Connected channels</span><span className="stat-icon mint"><Link2 size={17} /></span></div><strong>0</strong><small><span className="muted-dot" /> Connect your first channel</small></article>
                <article className="stat-card"><div className="stat-top"><span>Content ideas</span><span className="stat-icon peach"><Sparkles size={17} /></span></div><strong>0</strong><small><span className="muted-dot" /> Make room for inspiration</small></article>
              </section>
              <section className="dashboard-grid">
                <article className="panel quick-create"><div className="panel-heading"><div><span className="eyebrow">START CREATING</span><h2>What are we sharing today?</h2><p>Bring your idea. We'll help shape it into a post.</p></div><span className="panel-heading-icon"><WandSparkles size={20} /></span></div><button className="create-prompt" onClick={() => setActive("Content studio")}><span><Sparkles size={17} /> Describe the post you have in mind...</span><span className="prompt-arrow"><ArrowUpRight size={17} /></span></button><div className="quick-options"><span><FileImage size={15} /> Image post</span><span><MessageSquareText size={15} /> Caption ideas</span><span><CalendarDays size={15} /> Plan content</span></div></article>
                <article className="panel connect-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR CHANNELS</span><h2>Connect your socials</h2></div><span className="panel-heading-icon"><Link2 size={19} /></span></div><p className="panel-copy">Bring your Facebook Page and Instagram professional account into one workspace.</p><div className="social-connect-row"><span className="social-logo facebook-logo">f</span><span><b>Facebook Pages</b><small>Not connected</small></span><span className="connect-soon">Coming next</span></div><div className="social-connect-row"><span className="social-logo instagram-logo"><Instagram size={18} /></span><span><b>Instagram</b><small>Professional accounts</small></span><span className="connect-soon">Coming next</span></div></article>
              </section>
              <section className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h2>Recent activity</h2></div><button className="text-button" onClick={() => setActive("Calendar")}>Open calendar <ArrowRight size={14} /></button></div><div className="empty-activity"><span className="empty-icon"><Clock3 size={20} /></span><b>Your story starts here</b><p>Your drafts, scheduled posts and publishing updates will appear here.</p></div></section>
            </>
          ) : (
            <section className="section-placeholder panel"><span className="placeholder-icon"><LayoutGrid size={22} /></span><span className="eyebrow">POSTFLOW WORKSPACE</span><h1>{active}</h1><p>This section is part of the product roadmap. We're building it in stages so each feature connects properly to your Appwrite backend.</p><button className="secondary-button" onClick={() => setActive("Overview")}>Back to overview <ArrowRight size={15} /></button></section>
          )}
          <footer className="page-footer"><span>POSTFLOW AI <span className="footer-separator">·</span> Create. Schedule. Publish.</span><span>Built for ideas in motion.</span></footer>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [checkingSession, setCheckingSession] = useState(appwriteConfigured);

  useEffect(() => {
    let active = true;
    if (!appwriteConfigured) {
      setCheckingSession(false);
      return () => { active = false; };
    }
    account.get()
      .then(current => { if (active) setUser(current); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);

  async function signOut() {
    try {
      await account.deleteSession({ sessionId: "current" });
    } finally {
      setUser(null);
    }
  }

  if (checkingSession) {
    return <div className="loading-screen"><span className="brand-mark"><Send size={19} /></span><LoaderCircle className="spin" size={20} /><p>Preparing your workspace...</p></div>;
  }

  return user
    ? <Dashboard user={user} onSignOut={signOut} />
    : <AuthScreen onAuthenticated={setUser} />;
}
