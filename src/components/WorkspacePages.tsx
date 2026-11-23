import { useEffect, useMemo, useState } from "react";
import { Account, Query, TablesDB } from "appwrite";
import type { Models } from "appwrite";
import { Activity, ArrowRight, CalendarDays, CheckCircle2, Clock3, Facebook, Instagram, Lightbulb, LoaderCircle, LockKeyhole, RefreshCw, Settings2, Sparkles, UserRound } from "lucide-react";
import { client, appwriteConfigured } from "../lib/appwrite";
import "./workspace-pages.css";

const db = new TablesDB(client);
const account = new Account(client);
const DB_ID = "postflow-main";
const TABLE_ID = "content_posts";
type Post = Models.Row & { ownerId: string; title?: string; caption?: string; status?: string; platforms?: string[]; scheduledAt?: string; createdAt?: string };

function usePosts(userId: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function refresh() {
    if (!appwriteConfigured) { setError("Appwrite client configuration is missing."); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const result = await db.listRows({ databaseId: DB_ID, tableId: TABLE_ID, queries: [Query.equal("ownerId", userId), Query.orderDesc("$createdAt"), Query.limit(100)], ttl: 0 });
      setPosts(result.rows as unknown as Post[]);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load workspace data."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, [userId]);
  return { posts, loading, error, refresh };
}

function Empty({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="wp-empty"><span>{icon}</span><b>{title}</b><p>{text}</p></div>;
}

export function CalendarPage({ user }: { user: Models.User<Models.Preferences> }) {
  const { posts, loading, error, refresh } = usePosts(user.$id);
  const scheduled = useMemo(() => posts.filter(p => p.status === "queued" && p.scheduledAt).sort((a,b) => new Date(a.scheduledAt!).getTime()-new Date(b.scheduledAt!).getTime()), [posts]);
  return <div className="wp-page"><div className="wp-heading"><div><span className="wp-eyebrow">PLAN YOUR PRESENCE</span><h1>Content calendar</h1><p>Your saved schedule, in one place.</p></div><button className="wp-refresh" onClick={()=>void refresh()}><RefreshCw size={14}/> Refresh</button></div>
    <div className="wp-summary"><div><CalendarDays/><span><b>{scheduled.length}</b><small>scheduled posts</small></span></div><div><Clock3/><span><b>{scheduled.filter(p=>new Date(p.scheduledAt!)>new Date()).length}</b><small>upcoming</small></span></div></div>
    {error&&<div className="wp-alert">{error}</div>}
    {loading?<Empty icon={<LoaderCircle className="spin"/>} title="Loading calendar" text="Checking your saved schedule."/>:scheduled.length===0?<Empty icon={<CalendarDays/>} title="Your calendar is clear" text="Save a post as scheduled in Content Studio and it will appear here."/>:<div className="wp-post-list">{scheduled.map(post=><article className="wp-post" key={post.$id}><div className="wp-date"><b>{new Date(post.scheduledAt!).toLocaleDateString(undefined,{day:"2-digit"})}</b><small>{new Date(post.scheduledAt!).toLocaleDateString(undefined,{month:"short"})}</small></div><div className="wp-post-copy"><b>{post.title||"Untitled post"}</b><p>{post.caption||"No caption"}</p><small>{(post.platforms||[]).join(" · ")}</small></div><div className="wp-post-time"><Clock3 size={13}/>{new Date(post.scheduledAt!).toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"})}</div></article>)}</div>}
    <div className="wp-footnote">Calendar entries are saved plans only. Automatic publishing is not active until a secure scheduler and approved social-platform integration are configured.</div>
  </div>;
}

export function AccountsPage() {
  return <div className="wp-page"><div className="wp-heading"><div><span className="wp-eyebrow">CHANNEL MANAGEMENT</span><h1>Social accounts</h1><p>Prepare the channels you want to manage from POSTFLOW AI.</p></div></div>
    <div className="wp-account-grid">
      <article className="wp-account-card"><div className="wp-account-icon facebook"><Facebook/></div><div className="wp-account-title"><h2>Facebook Pages</h2><span className="wp-state pending">Not connected</span></div><p>Connect a Facebook Page you manage. Publishing access requires Meta authorization and the relevant app permissions.</p><button disabled className="wp-disabled">Connection setup pending</button></article>
      <article className="wp-account-card"><div className="wp-account-icon instagram"><Instagram/></div><div className="wp-account-title"><h2>Instagram</h2><span className="wp-state pending">Not connected</span></div><p>Instagram publishing is designed for eligible professional Business or Creator accounts with the required Meta setup.</p><button disabled className="wp-disabled">Connection setup pending</button></article>
    </div>
    <div className="wp-callout"><LockKeyhole size={17}/><p><b>Your account security matters.</b> Social access tokens must be stored server-side. Do not paste passwords, API keys or access tokens into this page or into GitHub source code.</p></div>
    <div className="wp-footnote">Meta OAuth, app review and publishing permissions have not yet been configured. This page does not claim any social account is connected.</div>
  </div>;
}

const ideas = [
  { tag:"EDUCATE", title:"Teach one useful thing", text:"Share a short tip that solves a common problem your audience faces.", format:"Carousel or single image" },
  { tag:"BEHIND THE SCENES", title:"Show how the work happens", text:"Walk people through a process, a decision or a small detail they rarely get to see.", format:"Photo with a personal caption" },
  { tag:"COMMUNITY", title:"Ask a focused question", text:"Invite your audience to share a preference, challenge or experience related to your work.", format:"Question-led post" },
  { tag:"PRODUCT", title:"Explain the benefit, not just the feature", text:"Choose one product feature and show how it helps a real customer.", format:"Product image and caption" },
  { tag:"STORY", title:"Share a lesson learned", text:"Tell a concise story about a mistake, discovery or improvement and what it taught you.", format:"Short story post" },
  { tag:"TRUST", title:"Answer a frequent question", text:"Turn a customer question into a clear, useful answer that others can save.", format:"FAQ graphic or text post" }
];

export function IdeasPage({ onCreate }: { onCreate: () => void }) {
  return <div className="wp-page"><div className="wp-heading"><div><span className="wp-eyebrow">CREATIVE SPARK</span><h1>Ideas & trends</h1><p>Practical prompts to help you plan your next post.</p></div><span className="wp-heading-mark"><Lightbulb/></span></div>
    <div className="wp-note"><Sparkles size={16}/><p>These are evergreen content prompts, not live trend measurements. Live trend discovery will need approved data sources.</p></div>
    <div className="wp-ideas-grid">{ideas.map((idea,i)=><article className="wp-idea" key={idea.title}><span className="wp-idea-number">0{i+1}</span><span className="wp-eyebrow">{idea.tag}</span><h2>{idea.title}</h2><p>{idea.text}</p><div className="wp-idea-bottom"><small>{idea.format}</small><button onClick={onCreate}>Create post <ArrowRight size={13}/></button></div></article>)}</div>
  </div>;
}

export function AnalyticsPage({ user }: { user: Models.User<Models.Preferences> }) {
  const { posts, loading, error, refresh } = usePosts(user.$id);
  const counts = useMemo(()=>({draft:posts.filter(p=>p.status==="draft").length,queued:posts.filter(p=>p.status==="queued").length,published:posts.filter(p=>p.status==="published").length,failed:posts.filter(p=>p.status==="failed").length}),[posts]);
  const max=Math.max(1,counts.draft,counts.queued,counts.published,counts.failed);
  return <div className="wp-page"><div className="wp-heading"><div><span className="wp-eyebrow">WORKSPACE OVERVIEW</span><h1>Content analytics</h1><p>Track your content workflow at a glance.</p></div><button className="wp-refresh" onClick={()=>void refresh()}><RefreshCw size={14}/> Refresh</button></div>
    {error&&<div className="wp-alert">{error}</div>}
    {loading?<Empty icon={<LoaderCircle className="spin"/>} title="Loading analytics" text="Counting your saved content."/>:<><div className="wp-metric-grid">{[{label:"Total posts",value:posts.length,icon:<Activity/>},{label:"Drafts",value:counts.draft,icon:<Settings2/>},{label:"Scheduled",value:counts.queued,icon:<CalendarDays/>},{label:"Published",value:counts.published,icon:<CheckCircle2/>}].map(m=><div className="wp-metric" key={m.label}><span>{m.icon}</span><small>{m.label}</small><b>{m.value}</b></div>)}</div>
      <section className="wp-card"><div className="wp-card-head"><div><span className="wp-eyebrow">CONTENT PIPELINE</span><h2>Post status</h2></div></div><div className="wp-bars">{[{label:"Drafts",value:counts.draft},{label:"Scheduled",value:counts.queued},{label:"Published",value:counts.published},{label:"Failed",value:counts.failed}].map(x=><div className="wp-bar-row" key={x.label}><span>{x.label}</span><div><i style={{width:(x.value/max*100)+"%"}}/></div><b>{x.value}</b></div>)}</div></section></>}
    <div className="wp-callout"><Activity size={17}/><p><b>Publishing performance is not connected yet.</b> Reach, impressions, engagement and follower changes require authorized Meta account connections and real platform analytics. The figures above are only your saved post workflow counts.</p></div>
  </div>;
}

export function SettingsPage({ user, onUserUpdated }: { user: Models.User<Models.Preferences>; onUserUpdated: (user: Models.User<Models.Preferences>)=>void }) {
  const [name,setName]=useState(user.name||"");
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  async function save(e:React.FormEvent) {
    e.preventDefault(); if(!name.trim()){setNotice("Enter a name first.");return;}
    setBusy(true);setNotice("");
    try{const updated=await account.updateName({name:name.trim()});onUserUpdated(updated);setNotice("Your profile name has been updated.");}
    catch(err){setNotice(err instanceof Error?err.message:"Could not update your profile.");}
    finally{setBusy(false);}
  }
  return <div className="wp-page"><div className="wp-heading"><div><span className="wp-eyebrow">YOUR PREFERENCES</span><h1>Settings</h1><p>Manage your POSTFLOW AI profile.</p></div></div>
    <section className="wp-card wp-settings"><div className="wp-card-head"><div><span className="wp-eyebrow">PROFILE</span><h2>Account details</h2></div><span className="wp-heading-mark"><UserRound/></span></div>
      <form onSubmit={save}><label>Display name<input value={name} onChange={e=>setName(e.target.value)} maxLength={100}/></label><label>Email address<input value={user.email} disabled/></label><button className="wp-primary" disabled={busy}>{busy?<LoaderCircle className="spin" size={15}/>:null}Save profile</button>{notice&&<p className="wp-settings-notice">{notice}</p>}</form>
    </section>
    <section className="wp-card wp-settings-info"><h2>Workspace configuration</h2><p>Database: <code>postflow-main</code></p><p>Content table: <code>content_posts</code></p><p>Media bucket: <code>post-media</code></p><p>Social publishing and AI provider credentials are not configured in the browser.</p></section>
    <div className="wp-footnote">Account email changes, billing and workspace member management are not included in this release.</div>
  </div>;
}
