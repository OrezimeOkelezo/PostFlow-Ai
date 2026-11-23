import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Functions, ID, Permission, Query, Role, Storage, TablesDB } from "appwrite";
import type { Models } from "appwrite";
import { client, appwriteConfigured } from "../lib/appwrite";
import { CalendarClock, ChevronDown, Clock3, Copy, FileText, ImagePlus, Instagram, LoaderCircle, Save, Sparkles, Trash2, Pencil } from "lucide-react";
import "./studio.css";

const db = new TablesDB(client);
const storage = new Storage(client);
const functions = new Functions(client);
const AI_FUNCTION_ID = import.meta.env.VITE_APPWRITE_AI_FUNCTION_ID?.trim() || "postflow-ai-content";
const DATABASE_ID = "postflow-main";
const POSTS_TABLE_ID = "content_posts";
type Post = Models.Row & { mediaFileId?: string; title?: string; caption?: string; hashtags?: string; status?: string; platforms?: string[]; scheduledAt?: string; ownerId: string };

function message(error: unknown) {
  return error && typeof error === "object" && "message" in error ? String((error as {message: unknown}).message) : "Something went wrong. Try again.";
}

export default function ContentStudio({ user }: { user: Models.User<Models.Preferences> }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [idea, setIdea] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["instagram"]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [status, setStatus] = useState<"draft" | "queued">("draft");
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadPosts() {
    if (!appwriteConfigured) { setLoading(false); return; }
    try {
      const result = await db.listRows({ databaseId: DATABASE_ID, tableId: POSTS_TABLE_ID, queries: [Query.equal("ownerId", user.$id), Query.orderDesc("$createdAt"), Query.limit(100)] });
      setPosts(result.rows as unknown as Post[]);
    } catch (error) { setNotice("Could not load saved posts: " + message(error)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadPosts(); }, [user.$id]);

  useEffect(() => { if (!image) { setImagePreview(""); return; } const url = URL.createObjectURL(image); setImagePreview(url); return () => URL.revokeObjectURL(url); }, [image]);

  const visiblePosts = useMemo(() => filter === "all" ? posts : posts.filter(post => post.status === filter), [posts, filter]);

  function togglePlatform(platform: string) {
    setPlatforms(current => current.includes(platform) ? current.filter(item => item !== platform) : [...current, platform]);
  }

  async function prepareBrief() {
    if (!idea.trim()) { setNotice("Describe your post idea first."); return; }
    if (!AI_FUNCTION_ID) {
      setTitle(title || idea.trim().slice(0, 80));
      setCaption(`Here's an idea worth sharing: ${idea.trim()}\n\nTell your audience why it matters, add one useful detail, and invite them to join the conversation.\n\nWhat do you think?`);
      setHashtags("#YourBrand #ContentIdeas #Community");
      setNotice("Starter draft prepared. Live AI generation is waiting for the Appwrite Function and provider key.");
      return;
    }
    setAiBusy(true); setNotice("");
    try {
      const brandResult = await db.listRows({ databaseId: DATABASE_ID, tableId: "brands", queries: [Query.equal("ownerId", user.$id), Query.limit(1)], ttl: 0 });
      const brand = brandResult.rows[0] as unknown as { name?: string; description?: string; tone?: string } | undefined;
      const execution = await functions.createExecution({
        functionId: AI_FUNCTION_ID,
        body: JSON.stringify({
          idea: idea.trim(),
          platform: platforms[0] || "instagram",
          brandName: brand?.name || "",
          brandDescription: brand?.description || "",
          tone: brand?.tone || "Friendly and helpful"
        }),
        async: false
      });
      if (execution.status === "failed") {
        let failure = "The Appwrite AI function failed.";
        try {
          const details = JSON.parse(execution.responseBody || "{}");
          if (details.error) failure = details.error;
        } catch { /* response may be empty for a platform-level failure */ }
        if (execution.responseStatusCode === 503) failure = "Appwrite returned 503. The function runtime is temporarily unavailable. Please retry in a moment.";
        throw new Error(failure);
      }
      if (execution.status !== "completed") throw new Error("AI generation is still processing. Wait a moment, then retry.");
      let result: { title?: string; caption?: string; hashtags?: string[]; error?: string };
      try { result = JSON.parse(execution.responseBody || "{}"); }
      catch { throw new Error("The AI function returned an unreadable response."); }
      if (execution.responseStatusCode && execution.responseStatusCode >= 400) throw new Error(result.error || `AI request failed (HTTP ${execution.responseStatusCode}).`);
      if (!result.caption) throw new Error(result.error || "The AI function did not return a caption.");
      setTitle(result.title || title || idea.trim().slice(0, 80));
      setCaption(result.caption);
      setHashtags(Array.isArray(result.hashtags) ? result.hashtags.join(" ") : "");
      setNotice("AI draft generated. Review and edit it before saving.");
    } catch (error) {
      setNotice("AI generation failed: " + message(error));
    } finally { setAiBusy(false); }
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!caption.trim()) { setNotice("Add a caption before saving."); return; }
    if (!platforms.length) { setNotice("Choose at least one platform."); return; }
    if (status === "queued" && !scheduledAt) { setNotice("Choose a date and time to schedule this post."); return; }
    if (status === "queued" && new Date(scheduledAt).getTime() <= Date.now()) { setNotice("Choose a future date and time."); return; }
    setBusy(true); setNotice("");
    let uploadedMediaId: string | null = null;
    try {
      let mediaFileId: string | null = null;
      if (image) { const uploaded = await storage.createFile({ bucketId: "post-media", fileId: ID.unique(), file: image, permissions: [Permission.read(Role.user(user.$id)), Permission.delete(Role.user(user.$id))] }); mediaFileId = uploaded.$id; uploadedMediaId = uploaded.$id; }
      const existingMediaId = editingId ? posts.find(item => item.$id === editingId)?.mediaFileId || null : null;
      const data = { ownerId: user.$id, mediaFileId: mediaFileId || existingMediaId, title: title.trim() || "Untitled post", caption: caption.trim(), hashtags: hashtags.trim(), status, platforms, scheduledAt: status === "queued" ? new Date(scheduledAt).toISOString() : null, createdAt: new Date().toISOString() };
      const row = editingId
        ? await db.updateRow({ databaseId: DATABASE_ID, tableId: POSTS_TABLE_ID, rowId: editingId, data })
        : await db.createRow({ databaseId: DATABASE_ID, tableId: POSTS_TABLE_ID, rowId: ID.unique(), data, permissions: [Permission.read(Role.user(user.$id)), Permission.update(Role.user(user.$id)), Permission.delete(Role.user(user.$id))] });
      if (editingId && uploadedMediaId && existingMediaId && uploadedMediaId !== existingMediaId) { try { await storage.deleteFile({ bucketId: "post-media", fileId: existingMediaId }); } catch { /* old media cleanup is best-effort */ } }
      setPosts(current => editingId ? current.map(item => item.$id === editingId ? row as unknown as Post : item) : [row as unknown as Post, ...current]);
      const wasEditing = Boolean(editingId); setEditingId(null); setTitle(""); setIdea(""); setCaption(""); setHashtags(""); setScheduledAt(""); setImage(null); setStatus("draft");
      setNotice(wasEditing ? "Post updated." : status === "queued" ? "Scheduled post saved. Automatic publishing is not active yet." : "Draft saved to your Appwrite workspace.");
    } catch (error) { if (uploadedMediaId) { try { await storage.deleteFile({ bucketId: "post-media", fileId: uploadedMediaId }); } catch { /* cleanup is best-effort */ } } setNotice("Could not save post: " + message(error)); }
    finally { setBusy(false); }
  }

  function editPost(post: Post) {
    setEditingId(post.$id);
    setTitle(post.title||"");
    setIdea("");
    setCaption(post.caption||"");
    setHashtags(post.hashtags||"");
    setPlatforms(post.platforms||[]);
    setStatus(post.status==="queued"?"queued":"draft");
    setScheduledAt(post.scheduledAt?new Date(post.scheduledAt).toISOString().slice(0,16):"");
    setNotice("Editing saved post. Save changes when ready.");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function deletePost(id: string) {
    if (!window.confirm("Delete this saved post?")) return;
    try { const post = posts.find(item => item.$id === id); await db.deleteRow({ databaseId: DATABASE_ID, tableId: POSTS_TABLE_ID, rowId: id }); if (post?.mediaFileId) { try { await storage.deleteFile({ bucketId: "post-media", fileId: post.mediaFileId }); } catch { /* row is deleted; inaccessible orphan can be cleaned up by an admin */ } } setPosts(current => current.filter(item => item.$id !== id)); }
    catch (error) { setNotice("Could not delete post: " + message(error)); }
  }

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); setNotice("Caption copied."); }
    catch { setNotice("Clipboard access is unavailable in this browser."); }
  }

  return <div className="studio-page">
    <div className="studio-intro"><div><span className="studio-eyebrow"><Sparkles size={14}/> CONTENT WORKSPACE</span><h1>Content studio</h1><p>Shape your ideas into posts, save drafts and plan what comes next.</p></div><div className="studio-count"><b>{posts.length}</b><span>saved posts</span></div></div>
    <div className="studio-grid">
      <section className="studio-card editor-card">
        <div className="studio-card-head"><div><span className="studio-kicker">NEW CONTENT</span><h2>Start with an idea</h2></div><span className="studio-icon"><Sparkles size={19}/></span></div>
        <label className="studio-label">What's the post about?<textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Example: Introduce our new collection and explain what makes it useful..." rows={3}/></label>
        <button type="button" className="studio-assist" onClick={()=>void prepareBrief()} disabled={aiBusy}>{aiBusy?<LoaderCircle className="spin" size={16}/>:<Sparkles size={16}/>} {aiBusy?"Generating...":AI_FUNCTION_ID?"Generate with AI":"Prepare a starter draft"} <span>{AI_FUNCTION_ID?"Function deployed":"Setup pending"}</span></button>
        <form onSubmit={savePost} className="studio-form">
          <label className="studio-label">Post title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Give this post a name"/></label>
          <label className="studio-label">Caption<textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Write your caption here..." rows={7} required/></label>
          <div className="studio-field-meta"><span>{caption.length} characters</span><button type="button" onClick={()=>void copyText(caption)} disabled={!caption}><Copy size={13}/> Copy caption</button></div>
          <label className="studio-label">Hashtags<input value={hashtags} onChange={e=>setHashtags(e.target.value)} placeholder="#YourBrand #YourTopic"/></label>
          <label className="studio-label">Post image (optional)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const file=e.target.files?.[0]||null;if(file && file.size>10*1024*1024){setNotice("Choose an image smaller than 10 MB.");e.target.value="";return;}setImage(file);}} /></label>
          <div className="studio-label">Publish to</div>
          <div className="platform-picks">
            <button type="button" className={platforms.includes("facebook")?"platform-pick chosen":"platform-pick"} onClick={()=>togglePlatform("facebook")}><span className="fb-letter">f</span> Facebook</button>
            <button type="button" className={platforms.includes("instagram")?"platform-pick chosen":"platform-pick"} onClick={()=>togglePlatform("instagram")}><Instagram size={17}/> Instagram</button>
          </div>
          <div className="studio-label">When should it go out?</div>
          <div className="publish-choice"><button type="button" className={status==="draft"?"choice active":"choice"} onClick={()=>setStatus("draft")}><FileText size={15}/> Save as draft</button><button type="button" className={status==="queued"?"choice active":"choice"} onClick={()=>setStatus("queued")}><CalendarClock size={15}/> Schedule</button></div>
          {status==="queued" && <label className="studio-label">Scheduled date and time<input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} min={new Date(Date.now()+60000).toISOString().slice(0,16)} /></label>}
          {notice && <div className="studio-notice" role="status">{notice}</div>}
          {editingId && <button type="button" className="studio-field-meta" onClick={()=>{setEditingId(null);setTitle("");setCaption("");setHashtags("");setIdea("");setScheduledAt("");setImage(null);setStatus("draft");setNotice("Editing cancelled.");}}>Cancel editing</button>}
          <button className="studio-save" type="submit" disabled={busy}>{busy?<LoaderCircle className="spin" size={16}/>:status==="queued"?<CalendarClock size={16}/>:<Save size={16}/>} {busy?"Saving...":editingId?"Update post":status==="queued"?"Save scheduled post":"Save draft"}</button>
        </form>
        <div className="studio-footnote">Scheduling stores your plan in the database. Automatic publishing will require an approved Meta integration and a secure background scheduler.</div>
      </section>
      <aside className="studio-side">
        <section className="studio-card preview-card"><div className="studio-card-head"><div><span className="studio-kicker">LIVE PREVIEW</span><h2>Your post</h2></div><span className="preview-dot"/></div><div className="preview-social"><span className="preview-avatar">{(user.name||"P").slice(0,1).toUpperCase()}</span><span><b>{user.name||"Your brand"}</b><small>{platforms.map(p=>p==="instagram"?"Instagram":"Facebook").join(" · ")||"Choose a platform"}</small></span><ChevronDown size={15}/></div><div className="preview-image">{imagePreview?<img src={imagePreview} alt="Selected post preview"/>:<><ImagePlus size={25}/><span>Image preview</span><small>Choose an image above to preview it</small></>}</div><div className="preview-copy">{caption||"Your caption will appear here as you write it."}<p>{hashtags}</p></div><div className="preview-actions"><span>♡ Like</span><span>◯ Comment</span><span>↗ Share</span></div></section>
        <section className="studio-tip"><span><Clock3 size={17}/></span><div><b>A thoughtful posting rhythm</b><p>Plan a mix of useful, personal and promotional content. Review every post before enabling automatic publishing.</p></div></section>
      </aside>
    </div>
    <section className="studio-card saved-posts"><div className="saved-head"><div><span className="studio-kicker">YOUR LIBRARY</span><h2>Saved content</h2></div><div className="saved-filters">{["all","draft","queued","published"].map(item=><button key={item} className={filter===item?"filter-active":""} onClick={()=>setFilter(item)}>{item==="all"?"All":item[0].toUpperCase()+item.slice(1)}</button>)}</div></div>
      {loading?<div className="saved-empty"><LoaderCircle className="spin"/> Loading your posts...</div>:visiblePosts.length===0?<div className="saved-empty"><FileText size={22}/><b>No saved posts here yet</b><span>Your drafts and scheduled posts will appear here.</span></div>:<div className="saved-list">{visiblePosts.map(post=><article className="saved-row" key={post.$id}><div className="saved-post-icon"><FileText size={17}/></div><div className="saved-post-main"><b>{post.title||"Untitled post"}</b><p>{post.caption||"No caption"}</p><small>{(post.platforms||[]).join(" · ")} {post.scheduledAt?" · "+new Date(post.scheduledAt).toLocaleString():""}</small></div><span className={"post-status status-"+post.status}>{post.status||"draft"}</span><button type="button" className="delete-post" onClick={()=>editPost(post)} aria-label="Edit post"><Pencil size={15}/></button><button type="button" className="delete-post" onClick={()=>void deletePost(post.$id)} aria-label="Delete post"><Trash2 size={16}/></button></article>)}</div>}
    </section>
  </div>;
}
