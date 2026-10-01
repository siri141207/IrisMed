/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Download,
  FileImage,
  FileText,
  Files,
  Filter,
  Globe2,
  Home,
  Languages,
  LoaderCircle,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  askQuestion,
  deleteDocument,
  documentFileUrl,
  getDocument,
  getDocuments,
  getHealth,
  uploadDocument,
} from "./services/api";
import "./App.css";

const LANGUAGES = ["English", "తెలుగు", "हिन्दी"];
const MAX_FILE_BYTES = 15 * 1024 * 1024;

function formatDate(value, withYear = true) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

function useAppearancePreferences() {
  const [theme, setTheme] = useStoredState("irismed-theme", "light");
  const [textSize, setTextSize] = useStoredState("irismed-text-size", "default");
  const [highVisibility, setHighVisibility] = useStoredState("irismed-high-visibility", false);
  const [comfortableSpacing, setComfortableSpacing] = useStoredState("irismed-comfortable-spacing", false);
  const [reduceMotion, setReduceMotion] = useStoredState("irismed-reduce-motion", false);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.textSize = textSize;
    root.classList.toggle("high-visibility", highVisibility);
    root.classList.toggle("comfortable-spacing", comfortableSpacing);
    root.classList.toggle("reduce-motion", reduceMotion);
  }, [theme, textSize, highVisibility, comfortableSpacing, reduceMotion]);

  return { theme, setTheme, textSize, setTextSize, highVisibility, setHighVisibility, comfortableSpacing, setComfortableSpacing, reduceMotion, setReduceMotion };
}

function PreferenceLayer({ children }) {
  useAppearancePreferences();
  return children;
}

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [health, setHealth] = useState("checking");
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    getHealth().then((data) => {
      if (mounted) setHealth(data.ai_configured ? "ready" : "no-ai");
    }).catch(() => {
      if (mounted) setHealth("offline");
    });
    return () => { mounted = false; };
  }, [location.pathname]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="product-shell">
      <button className={`mobile-overlay ${mobileOpen ? "show" : ""}`} onClick={closeMobile} aria-label="Close menu" />
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <Link to="/dashboard" className="side-brand" onClick={closeMobile}>
          <div className="brand-mark" aria-hidden="true"><span /><span /></div>
          <div><strong>IrisMed</strong><small>Eye record intelligence</small></div>
        </Link>

        <div className="side-section">
          <span className="side-label">WORKSPACE</span>
          <NavLink to="/dashboard" className="side-link" onClick={closeMobile}><Home size={17} />Dashboard</NavLink>
          <NavLink to="/records" className="side-link" onClick={closeMobile}><Files size={17} />My eye records</NavLink>
          <NavLink to="/ask" className="side-link" onClick={closeMobile}><MessageCircle size={17} />Ask IrisMed</NavLink>
          <NavLink to="/compare" className="side-link" onClick={closeMobile}><Activity size={17} />Compare reports</NavLink>
        </div>

        <div className="side-section">
          <span className="side-label">ACCOUNT</span>
          <NavLink to="/language" className="side-link" onClick={closeMobile}><Languages size={17} />Language</NavLink>
          <NavLink to="/settings" className="side-link" onClick={closeMobile}><Settings size={17} />Settings</NavLink>
        </div>

        <div className="privacy-mini">
          <ShieldCheck size={17} />
          <div><strong>Private workspace</strong><span>Records stay in this local IrisMed instance.</span></div>
        </div>

        <div className="system-status">
          <span className={`status-dot ${health}`} />
          <span>{health === "ready" ? "AI services ready" : health === "offline" ? "API offline" : health === "no-ai" ? "AI key not configured" : "Checking services"}</span>
        </div>

        <div className="profile-mini">
          <div className="profile-avatar">IM</div>
          <div><strong>My IrisMed</strong><span>Personal workspace</span></div>
        </div>
      </aside>

      <main className="product-main">
        <div className="mobile-topbar">
          <button className="icon-action" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <Link to="/dashboard" className="mobile-brand"><span className="mini-mark"><i /><i /></span>IrisMed</Link>
          <Link to="/upload" className="icon-action" aria-label="Upload"><Plus size={20} /></Link>
        </div>
        {children}
      </main>
    </div>
  );
}

function Topbar({ title, description, action, eyebrow = "IRISMED / WORKSPACE" }) {
  return (
    <header className="page-topbar">
      <div className="topbar-copy"><div className="breadcrumb">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action && <div className="topbar-action">{action}</div>}
    </header>
  );
}

function ErrorBanner({ children, onClose }) {
  return <div className="error-banner"><CircleAlert size={17} /><span>{children}</span>{onClose && <button onClick={onClose}><X size={15} /></button>}</div>;
}

function EmptyState({ title, description, action }) {
  return <div className="empty-state"><div className="empty-icon"><FileText size={24} /></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

function StatusPill({ status }) {
  const label = status === "processed" ? "Processed" : status === "failed" ? "Failed" : "Processing";
  return <span className={`status-pill ${status || "processing"}`}><span />{label}</span>;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  return "Good evening.";
}

function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try { setError(""); setLoading(true); setReports(await getDocuments()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const latest = reports.find((r) => r.status === "processed") || reports[0];
  const processed = reports.filter((r) => r.status === "processed");

  return <Layout>
    <Topbar title={greeting()} description="Your eye records, organized without the medical jargon." action={<Link to="/upload" className="solid-action"><Upload size={17} />Upload report</Link>} />
    <div className="page-content">
      {error && <ErrorBanner onClose={() => setError("")}>{error}</ErrorBanner>}
      <section className="dashboard-grid">
        <div className="dashboard-main">
          <div className="section-intro"><div><span className="eyebrow-small">YOUR RECORDS</span><h2>Eye records at a glance</h2></div><Link to="/records" className="text-action">View all <ArrowRight size={15} /></Link></div>
          <div className="metric-grid">
            <MetricCard label="RECORDS" value={loading ? "—" : reports.length} note="documents stored" />
            <MetricCard label="LATEST RECORD" value={latest ? formatDate(latest.date, false) : "—"} note={latest?.type || "Upload a report to begin"} />
            <MetricCard label="PROCESSED" value={loading ? "—" : processed.length} note="ready for questions" />
          </div>

          <section className="dashboard-panel">
            <div className="panel-heading"><div><span className="eyebrow-small">RECENT RECORDS</span><h3>Your latest documents</h3></div><Link to="/upload" className="icon-action"><Plus size={18} /></Link></div>
            <div className="record-list">
              {loading ? <LoadingRows count={3} /> : reports.length === 0 ? <EmptyState title="No eye records yet" description="Upload your first prescription or examination report." action={<Link to="/upload" className="outline-action">Upload first record</Link>} /> : reports.slice(0, 5).map((report) => <RecordRow report={report} key={report.id} />)}
            </div>
          </section>
        </div>

        <aside className="dashboard-side">
          <div className="next-card">
            <span className="eyebrow-small">RECORD TIMELINE</span>
            <div className="timeline-stat"><strong>{processed.length}</strong><span>processed records</span></div>
            <h3>Everything stays connected.</h3>
            <p>Each upload keeps its extracted fields, source pages and original document together.</p>
            <div className="source-note"><ShieldCheck size={15} /><span>Source-linked information</span></div>
          </div>
          <div className="ask-card">
            <div className="ask-icon"><Sparkles size={18} /></div><span className="eyebrow-small">ASK IRISMED</span>
            <h3>Something in a report doesn't make sense?</h3>
            <p>Ask about SPH, CYL, AXIS, visual acuity, notes or follow-up instructions.</p>
            <Link to="/ask" className="card-link">Ask a question <ArrowRight size={16} /></Link>
          </div>
          <div className="trust-card"><ShieldCheck size={18} /><div><strong>Explanation, not diagnosis.</strong><span>IrisMed organizes and explains what your records say.</span></div></div>
        </aside>
      </section>
    </div>
  </Layout>;
}

function MetricCard({ label, value, note }) { return <div className="metric-card"><span className="metric-label">{label}</span><strong>{value}</strong><span className="metric-note">{note}</span></div>; }
function LoadingRows({ count = 3 }) { return <>{Array.from({ length: count }).map((_, i) => <div className="skeleton-row" key={i}><span /><div><i /><i /></div><b /></div>)}</>; }
function RecordRow({ report }) { return <Link to={`/records/${report.id}`} className="record-row"><div className="record-icon"><FileText size={19} /></div><div className="record-info"><strong>{report.name}</strong><span>{report.type || "Eye-care document"} · {report.pages || 0} {report.pages === 1 ? "page" : "pages"}</span></div><StatusPill status={report.status} /><ChevronRight size={17} className="row-chevron" /></Link>; }

function Records() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => { try { setError(""); setLoading(true); setReports(await getDocuments()); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => reports.filter((r) => {
    const matchesSearch = `${r.name} ${r.type} ${r.status}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (filter === "all" || r.status === filter);
  }), [reports, search, filter]);

  return <Layout>
    <Topbar title="My eye records" description="A private timeline of the documents you've added." action={<Link to="/upload" className="solid-action"><Plus size={17} />Add record</Link>} />
    <div className="page-content records-page">
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <div className="records-toolbar"><div className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports, types or status..." /></div><div className="filter-group"><Filter size={15} /><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All records</option><option value="processed">Processed</option><option value="processing">Processing</option><option value="failed">Failed</option></select></div></div>
      <div className="records-table">
        <div className="records-table-head"><span>DOCUMENT</span><span>TYPE</span><span>DATE</span><span>STATUS</span><span /></div>
        {loading ? <LoadingRows count={5} /> : filtered.length === 0 ? <EmptyState title={reports.length ? "No matching records" : "No records yet"} description={reports.length ? "Try a different search or filter." : "Upload an eye report to create your first record."} action={<Link to="/upload" className="outline-action"><Upload size={16} />Upload document</Link>} /> : filtered.map((report) => <Link to={`/records/${report.id}`} className="records-table-row" key={report.id}><div className="table-document"><div className="record-icon"><FileText size={18} /></div><div><strong>{report.name}</strong><span>{formatSize(report.size)} · {report.pages || 0} {report.pages === 1 ? "page" : "pages"}</span></div></div><span>{report.type || "Unknown"}</span><span>{formatDate(report.date)}</span><StatusPill status={report.status} /><ChevronRight size={17} /></Link>)}
      </div>
    </div>
  </Layout>;
}

function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function selectFile(selected) {
    if (!selected) return;
    if (!["application/pdf", "image/jpeg", "image/png"].includes(selected.type)) { setError("IrisMed accepts PDF, JPG and PNG files only."); return; }
    if (selected.size > MAX_FILE_BYTES) { setError("The file must be smaller than 15 MB."); return; }
    setFile(selected); setError(""); setResult(null);
  }
  async function process() {
    if (!file) return;
    setUploading(true); setError("");
    try { const data = await uploadDocument(file); setResult(data); setFile(null); }
    catch (err) { setError(err.message); }
    finally { setUploading(false); }
  }

  return <Layout>
    <Topbar title="Add an eye record" description="Upload a prescription or eye report. IrisMed extracts the information and keeps it linked to the original file." />
    <div className="page-content upload-page">
      <div className="upload-layout">
        <div className="upload-main">
          <div className={`upload-box ${dragging ? "dragging" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); selectFile(e.dataTransfer.files?.[0]); }}>
            <div className="upload-symbol"><Upload size={24} /></div>
            <span className="upload-kicker">DOCUMENT INTAKE</span>
            <h2>{uploading ? "Reading your report..." : file ? file.name : "Drop an eye report here"}</h2>
            <p>{uploading ? "IrisMed is extracting visible record information. This can take a little while for larger documents." : "Drag and drop a PDF, JPG or PNG, or choose one from your computer."}</p>
            <input ref={inputRef} hidden type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => selectFile(e.target.files?.[0])} />
            {!uploading && <button className="choose-file" onClick={() => inputRef.current?.click()}><FileText size={16} />{file ? "Choose a different file" : "Choose document"}</button>}
            {file && !uploading && <div className="selected-file"><div className="file-type"><FileImage size={18} /></div><div><strong>{file.name}</strong><span>{file.type === "application/pdf" ? "PDF" : "Image"} · {formatSize(file.size)}</span></div><button onClick={() => setFile(null)} aria-label="Remove file"><X size={16} /></button></div>}
            {file && !uploading && <button className="solid-action upload-process" onClick={process}><Sparkles size={16} />Process report</button>}
            {uploading && <div className="processing-status"><LoaderCircle size={17} className="spin" /> Extracting document data securely...</div>}
            {error && <ErrorBanner onClose={() => setError("")}>{error}</ErrorBanner>}
            {result && <div className="success-banner"><Check size={18} /><div><strong>Record processed</strong><span>{result.name} · {result.document_type || "Eye-care document"} · {result.page_count || 1} {result.page_count === 1 ? "page" : "pages"}</span></div><Link to={`/records/${result.id}`}>Open <ArrowRight size={15} /></Link></div>}
            <span className="upload-limit">PDF, JPG or PNG · maximum 15 MB</span>
          </div>
          <div className="supported-grid"><Support icon={<FileText size={19} />} title="Prescription" text="SPH · CYL · AXIS · visual acuity" /><Support icon={<Files size={19} />} title="Eye-test report" text="Findings · measurements · notes" /><Support icon={<CalendarDays size={19} />} title="Follow-up" text="Dates · recommendations · instructions" /></div>
        </div>
        <aside className="upload-side">
          <div className="process-card"><span className="eyebrow-small">IRISMED PIPELINE</span><ProcessStep n="01" title="Read" text="PDF text and document visuals are analyzed." /><ProcessStep n="02" title="Extract" text="Prescription, dates, notes and recommendations are structured." /><ProcessStep n="03" title="Link" text="Fields stay connected to source pages where available." /><ProcessStep n="04" title="Explain" text="Ask questions using the record-aware assistant." /></div>
          <div className="upload-privacy"><ShieldCheck size={18} /><div><strong>Built for sensitive records</strong><span>IrisMed avoids inventing missing medical values and clearly separates record facts from explanations.</span></div></div>
          <button className="text-action retry-button" onClick={() => navigate("/records")}>View existing records <ArrowRight size={15} /></button>
        </aside>
      </div>
    </div>
  </Layout>;
}
function Support({ icon, title, text }) { return <div className="support-item">{icon}<strong>{title}</strong><span>{text}</span></div>; }
function ProcessStep({ n, title, text }) { return <div className="process-step"><span>{n}</span><div><strong>{title}</strong><p>{text}</p></div></div>; }

function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = async () => { try { setError(""); setReport(await getDocument(id)); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [id]);

  async function remove() {
    if (!window.confirm("Delete this record and its stored document?")) return;
    setDeleting(true);
    try { await deleteDocument(id); navigate("/records"); } catch (err) { setError(err.message); setDeleting(false); }
  }

  if (loading) return <Layout><Topbar title="Opening record" description="Loading the source document and extracted details..." /><div className="page-content"><div className="loading-panel"><LoaderCircle className="spin" size={24} /></div></div></Layout>;
  if (error || !report) return <Layout><Topbar title="Record unavailable" description="IrisMed could not open this record." /><div className="page-content"><ErrorBanner>{error || "Document not found."}</ErrorBanner><Link to="/records" className="outline-action"><ArrowLeft size={16} />Back to records</Link></div></Layout>;

  const extracted = report.extracted || {};
  const prescription = extracted.prescription || {};
  const fields = [
    ["Right SPH", prescription.right_sph], ["Right CYL", prescription.right_cyl], ["Right AXIS", prescription.right_axis], ["Right VA", prescription.right_visual_acuity],
    ["Left SPH", prescription.left_sph], ["Left CYL", prescription.left_cyl], ["Left AXIS", prescription.left_axis], ["Left VA", prescription.left_visual_acuity],
  ];
  const fieldCount = fields.filter(([, v]) => v?.value).length + (extracted.follow_up ? 1 : 0) + (extracted.medications?.length || 0) + (extracted.findings?.length || 0);
  const fileUrl = documentFileUrl(report.id);

  return <Layout>
    <Topbar title={report.name} description={`${report.type || "Eye-care document"} · ${formatDate(report.created_at || report.date)} · ${report.pages || 1} ${report.pages === 1 ? "page" : "pages"}`} action={<div className="detail-actions"><Link to="/ask" state={{ documentId: report.id }} className="solid-action"><Sparkles size={16} />Ask about this</Link><a className="icon-action" href={fileUrl} download={report.name} title="Download original"><Download size={17} /></a><button className="icon-action danger-icon" onClick={remove} disabled={deleting} title="Delete record">{deleting ? <LoaderCircle className="spin" size={17} /> : <Trash2 size={17} />}</button></div>} />
    <div className="page-content">
      <div className="detail-meta"><StatusPill status={report.status} /><span>{formatSize(report.size)}</span><span>{fieldCount} extracted item{fieldCount === 1 ? "" : "s"}</span>{extracted.examination_date && <span>Exam {extracted.examination_date}</span>}</div>
      {report.status !== "processed" && <ErrorBanner>This record did not finish processing. Upload it again after checking the AI service.</ErrorBanner>}
      <div className="report-layout">
        <section className="document-preview"><div className="document-toolbar"><span>ORIGINAL DOCUMENT</span><a href={fileUrl} target="_blank" rel="noreferrer">Open source <ArrowRight size={14} /></a></div><div className="document-frame">{report.mime_type === "application/pdf" ? <iframe title={report.name} src={fileUrl} /> : <img src={fileUrl} alt={report.name} />}</div></section>
        <aside className="extracted-panel">
          <div className="panel-heading"><div><span className="eyebrow-small">EXTRACTED DETAILS</span><h3>What IrisMed found</h3></div></div>
          {extracted.summary && <div className="summary-box"><span className="field-heading">SUMMARY</span><p>{extracted.summary}</p></div>}
          <div className="verification-banner"><ShieldCheck size={18} /><div><strong>{fieldCount} source-linked item{fieldCount === 1 ? "" : "s"}</strong><span>Values are shown as recorded where available.</span></div></div>
          <div className="field-group"><span className="field-heading">PRESCRIPTION &amp; VISUAL ACUITY</span>{fields.map(([label, item]) => <FieldRow key={label} label={label} item={item} />)}</div>
          {extracted.follow_up && <div className="field-group"><span className="field-heading">FOLLOW-UP</span><div className="source-field"><CalendarDays size={16} /><div><strong>{extracted.follow_up}</strong><span>Source · Page {firstPage(extracted, "follow_up")}</span></div></div></div>}
          {extracted.findings?.length > 0 && <ListGroup title="FINDINGS" items={extracted.findings} />}
          {extracted.medications?.length > 0 && <ListGroup title="MEDICATIONS" items={extracted.medications} />}
          {extracted.doctor_recommendations?.length > 0 && <ListGroup title="RECOMMENDATIONS" items={extracted.doctor_recommendations} />}
          <div className="detail-note"><ShieldCheck size={16} /><span>IrisMed explains record content; it does not determine clinical significance.</span></div>
        </aside>
      </div>
    </div>
  </Layout>;
}
function firstPage(extracted, key) { const value = extracted?.[key]; if (value?.page) return value.page; return extracted?.pages_found?.[0] || 1; }
function FieldRow({ label, item }) { return <div className="field-row"><span>{label}</span>{item?.value ? <strong>{item.value}{item.page ? <small>p.{item.page}</small> : null}</strong> : <em>Not found</em>}</div>; }
function ListGroup({ title, items }) { return <div className="field-group"><span className="field-heading">{title}</span><ul className="detail-list">{items.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ul></div>; }

function AskIrisMed() {
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [documentId, setDocumentId] = useState(location.state?.documentId || "");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [language] = useStoredState("irismed-language", "English");
  const endRef = useRef(null);

  useEffect(() => { getDocuments().then(setReports).catch((err) => setError(err.message)); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);
  const effectiveDocumentId = documentId || String(reports.find((r) => r.status === "processed")?.id || "");
  const active = reports.find((r) => String(r.id) === String(effectiveDocumentId));
  const questions = ["What does my prescription say?", "What do SPH, CYL and AXIS mean?", "When is my follow-up?", "What findings are written in this report?"];

  async function send(text = question) {
    const clean = text.trim();
    if (!clean || !effectiveDocumentId || sending) return;
    setQuestion(""); setError(""); setMessages((prev) => [...prev, { role: "user", text: clean }]); setSending(true);
    try { const result = await askQuestion(effectiveDocumentId, clean, language); setMessages((prev) => [...prev, { role: "assistant", text: result.answer, sources: result.sources }]); }
    catch (err) { setError(err.message); }
    finally { setSending(false); }
  }

  return <Layout>
    <Topbar title="Ask IrisMed" description="Ask questions about one uploaded record at a time." />
    <div className="page-content"><div className="chat-layout">
      <aside className="chat-context">
        <span className="eyebrow-small">CURRENT SOURCE</span>
        <div className="source-selector"><label>Record</label><select value={effectiveDocumentId} onChange={(e) => { setDocumentId(e.target.value); setMessages([]); }}><option value="">Choose a processed record</option>{reports.filter((r) => r.status === "processed").map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
        {active && <div className="context-document"><div className="record-icon"><FileText size={18} /></div><div><strong>{active.name}</strong><span>{formatDate(active.date)} · {active.pages || 1} pages</span></div></div>}
        <span className="context-label">TRY ASKING</span><div className="question-list">{questions.map((q) => <button key={q} onClick={() => send(q)} disabled={!effectiveDocumentId || sending}>{q}<ArrowRight size={14} /></button>)}</div>
        <div className="chat-note"><ShieldCheck size={16} /><span>Answers are grounded in the selected record. Missing information is not guessed.</span></div>
      </aside>
      <section className="chat-window">
        <div className="chat-header"><div className="ask-icon"><Sparkles size={18} /></div><div><strong>IrisMed explanation</strong><span>{active ? active.name : "Select a record to begin"}</span></div></div>
        <div className="conversation">
          {!messages.length && <div className="chat-welcome"><span className="eyebrow-small">DOCUMENT-AWARE ASSISTANT</span><h2>What do you want to understand?</h2><p>Ask in normal language. IrisMed will use the selected record and show the source pages it relied on.</p></div>}
          {messages.map((message, index) => <div className={message.role === "user" ? "user-message" : "assistant-message"} key={index}>{message.role === "assistant" && <span className="message-label">IRISMED</span>}<p>{message.text}</p>{message.sources?.length > 0 && <div className="message-source">Sources · {message.sources.map((s) => `Page ${s.page}`).join(" · ")}</div>}</div>)}
          {sending && <div className="assistant-message typing"><span className="message-label">IRISMED</span><span className="typing-dots"><i /><i /><i /></span></div>}
          <div ref={endRef} />
        </div>
        {error && <div className="chat-error"><CircleAlert size={15} />{error}</div>}
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}><input value={question} onChange={(e) => setQuestion(e.target.value)} disabled={!effectiveDocumentId || sending} placeholder={effectiveDocumentId ? "Ask something about this report..." : "Choose a record first..."} /><button disabled={!effectiveDocumentId || !question.trim() || sending} aria-label="Send"><Send size={17} /></button></form>
      </section>
    </div></div>
  </Layout>;
}

function Compare() {
  const [reports, setReports] = useState([]);
  const [olderId, setOlderId] = useState("");
  const [newerId, setNewerId] = useState("");
  const [older, setOlder] = useState(null);
  const [newer, setNewer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { getDocuments().then((data) => { const processed = data.filter((r) => r.status === "processed"); setReports(processed); if (processed.length >= 2) { setOlderId(String(processed[processed.length - 1].id)); setNewerId(String(processed[0].id)); } }).catch((err) => setError(err.message)); }, []);
  useEffect(() => { if (olderId) getDocument(olderId).then(setOlder).catch(() => setOlder(null)); }, [olderId]);
  useEffect(() => { if (newerId) getDocument(newerId).then(setNewer).catch(() => setNewer(null)); }, [newerId]);

  const rows = ["right_sph", "right_cyl", "right_axis", "right_visual_acuity", "left_sph", "left_cyl", "left_axis", "left_visual_acuity"].map((key) => {
    const label = { right_sph: "Right SPH", right_cyl: "Right CYL", right_axis: "Right AXIS", right_visual_acuity: "Right VA", left_sph: "Left SPH", left_cyl: "Left CYL", left_axis: "Left AXIS", left_visual_acuity: "Left VA" }[key];
    const a = older?.extracted?.prescription?.[key]?.value || "—";
    const b = newer?.extracted?.prescription?.[key]?.value || "—";
    return { label, a, b, change: calculateChange(a, b) };
  });

  return <Layout><Topbar title="Compare reports" description="Place two processed records side by side. IrisMed describes recorded differences without judging clinical significance." />
    <div className="page-content compare-page">
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <div className="compare-selectors"><CompareSelect label="OLDER RECORD" value={olderId} onChange={setOlderId} reports={reports} exclude={newerId} /><div className="compare-arrow"><ArrowRight size={18} /></div><CompareSelect label="NEWER RECORD" value={newerId} onChange={setNewerId} reports={reports} exclude={olderId} /></div>
      {reports.length < 2 ? <EmptyState title="Two processed records are needed" description="Upload and process at least two eye records before comparing them." action={<Link to="/upload" className="outline-action"><Upload size={16} />Upload record</Link>} /> : <section className="comparison-panel"><div className="comparison-heading"><div><span className="eyebrow-small">PRESCRIPTION &amp; VA</span><h3>Recorded measurements</h3></div><span className="comparison-note">Changes are arithmetic descriptions, not clinical judgments.</span></div><div className="comparison-table"><div className="comparison-row header"><span>MEASUREMENT</span><span>{formatDate(older?.date || older?.created_at, false)}</span><span>{formatDate(newer?.date || newer?.created_at, false)}</span><span>CHANGE</span></div>{rows.map((row) => <div className="comparison-row" key={row.label}><strong>{row.label}</strong><span>{row.a}</span><span>{row.b}</span><span className={row.change === "No recorded change" ? "muted-change" : ""}>{row.change}</span></div>)}</div><div className="comparison-disclaimer"><ShieldCheck size={17} /><p>IrisMed can compare the values that appear in the two records. It does not decide whether a difference is medically important.</p></div></section>}
    </div></Layout>;
}
function CompareSelect({ label, value, onChange, reports, exclude }) { return <div className="compare-select"><span>{label}</span><div className="select-wrap"><FileText size={16} /><select value={value} onChange={(e) => onChange(e.target.value)}><option value="">Choose a record</option>{reports.filter((r) => String(r.id) !== String(exclude)).map((r) => <option key={r.id} value={r.id}>{r.name} · {formatDate(r.date)}</option>)}</select><ChevronRight size={15} /></div></div>; }
function calculateChange(a, b) { if (a === "—" || b === "—") return "Not available"; const x = Number.parseFloat(a), y = Number.parseFloat(b); if (Number.isNaN(x) || Number.isNaN(y)) return a === b ? "No recorded change" : "Changed"; const d = y - x; if (Math.abs(d) < 0.0001) return "No recorded change"; return `${d > 0 ? "+" : ""}${d.toFixed(2)}`; }

function Language() {
  const [language, setLanguage] = useStoredState("irismed-language", "English");
  return <Layout><Topbar title="Language" description="Choose the language IrisMed uses for explanations." /><div className="page-content settings-page"><section className="settings-card"><div className="settings-icon"><Globe2 size={20} /></div><div><span className="eyebrow-small">RESPONSE LANGUAGE</span><h2>How should IrisMed explain things?</h2><p>The selected language is used for Ask IrisMed responses. Medical abbreviations such as SPH, CYL and AXIS remain unchanged.</p></div><div className="language-options">{LANGUAGES.map((item) => <button className={language === item ? "selected" : ""} key={item} onClick={() => setLanguage(item)}><span>{item}</span>{language === item && <Check size={17} />}</button>)}</div></section></div></Layout>;
}

function SettingsPage() {
  const [language, setLanguage] = useStoredState("irismed-language", "English");
  const [theme, setTheme] = useStoredState("irismed-theme", "light");
  const [textSize, setTextSize] = useStoredState("irismed-text-size", "default");
  const [highVisibility, setHighVisibility] = useStoredState("irismed-high-visibility", false);
  const [comfortableSpacing, setComfortableSpacing] = useStoredState("irismed-comfortable-spacing", false);
  const [reduceMotion, setReduceMotion] = useStoredState("irismed-reduce-motion", false);
  const [confirmClear, setConfirmClear] = useState(false);

  function clearPreferences() {
    [
      "irismed-language",
      "irismed-theme",
      "irismed-text-size",
      "irismed-high-visibility",
      "irismed-comfortable-spacing",
      "irismed-reduce-motion",
    ].forEach((key) => localStorage.removeItem(key));
    setLanguage("English");
    setTheme("light");
    setTextSize("default");
    setHighVisibility(false);
    setComfortableSpacing(false);
    setReduceMotion(false);
    setConfirmClear(false);
  }

  return <Layout>
    <Topbar title="Settings" description="Tune IrisMed for how you read, see and use the workspace." />
    <div className="page-content settings-page">
      <section className="settings-card settings-section">
        <div className="settings-icon"><Settings size={20} /></div>
        <div className="settings-intro">
          <span className="eyebrow-small">APPEARANCE &amp; READING</span>
          <h2>Make IrisMed easier on your eyes.</h2>
          <p>These preferences are saved in this browser and apply across the entire workspace.</p>
        </div>

        <div className="preference-block">
          <div className="preference-heading">
            <div><strong>Theme</strong><span>Choose the visual environment you prefer for reading records.</span></div>
          </div>
          <div className="theme-options">
            {[['light','Light','Clean ivory workspace'],['dark','Dark','Low-light reading'],['warm','Eye comfort','Warm, softer contrast'],['contrast','High contrast','Maximum visual separation'],['system','System','Follow your device']].map(([value,label,desc]) => (
              <button key={value} className={`theme-option ${theme === value ? 'selected' : ''}`} onClick={() => setTheme(value)}>
                <span className={`theme-swatch ${value}`} aria-hidden="true" />
                <span className="theme-copy"><strong>{label}</strong><small>{desc}</small></span>
                {theme === value && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>

        <div className="preference-block">
          <div className="preference-heading">
            <div><strong>Text size</strong><span>Increase readable text without making the whole interface oversized.</span></div>
            <span className="size-preview">Aa</span>
          </div>
          <div className="text-size-options">
            {[['small','Small','90%'],['default','Default','100%'],['large','Large','112%'],['extra-large','Extra large','126%']].map(([value,label,scale]) => (
              <button key={value} className={`text-size-option ${textSize === value ? 'selected' : ''}`} onClick={() => setTextSize(value)}>
                <span className={`sample ${value}`}>Aa</span><span><strong>{label}</strong><small>{scale}</small></span>
                {textSize === value && <Check size={15} />}
              </button>
            ))}
          </div>
        </div>

        <div className="preference-block">
          <div className="preference-heading"><div><strong>Reading comfort</strong><span>Extra visual adjustments for longer reading sessions.</span></div></div>
          <div className="toggle-list">
            <button className="toggle-row" onClick={() => setHighVisibility(!highVisibility)}><span><strong>High visibility</strong><small>Stronger borders, clearer controls and more distinct text.</small></span><span className={`toggle ${highVisibility ? 'on' : ''}`}><i /></span></button>
            <button className="toggle-row" onClick={() => setComfortableSpacing(!comfortableSpacing)}><span><strong>Comfortable spacing</strong><small>More line height and breathing room between interface elements.</small></span><span className={`toggle ${comfortableSpacing ? 'on' : ''}`}><i /></span></button>
            <button className="toggle-row" onClick={() => setReduceMotion(!reduceMotion)}><span><strong>Reduce motion</strong><small>Minimize transitions and animated effects.</small></span><span className={`toggle ${reduceMotion ? 'on' : ''}`}><i /></span></button>
          </div>
        </div>
      </section>

      <section className="settings-card settings-section secondary-settings">
        <div className="settings-icon"><Globe2 size={20} /></div>
        <div className="settings-intro"><span className="eyebrow-small">LANGUAGE</span><h2>Response language</h2><p>Choose the language IrisMed uses for explanations. Medical abbreviations such as SPH, CYL and AXIS remain unchanged.</p></div>
        <div className="setting-line"><div><strong>Current language</strong><span>{language}</span></div><Link to="/language" className="outline-action">Change</Link></div>
      </section>

      <section className="settings-card settings-section secondary-settings">
        <div className="settings-icon"><ShieldCheck size={20} /></div>
        <div className="settings-intro"><span className="eyebrow-small">PRIVACY</span><h2>Local workspace</h2><p>Your display preferences live in this browser. Uploaded records and extracted data remain managed by the IrisMed backend.</p></div>
        <div className="setting-line"><div><strong>Record handling</strong><span>Source files and extracted records are stored by the IrisMed backend.</span></div><ShieldCheck size={19} /></div>
      </section>

      <section className="settings-card settings-section danger-card">
        <div className="danger-zone"><div><strong>Reset browser preferences</strong><span>Returns theme, text size, reading comfort and language settings to their defaults. It does not delete medical records.</span></div>{confirmClear ? <div className="confirm-actions"><button className="outline-action" onClick={() => setConfirmClear(false)}>Cancel</button><button className="danger-button" onClick={clearPreferences}>Reset</button></div> : <button className="outline-action" onClick={() => setConfirmClear(true)}>Reset preferences</button>}</div>
      </section>
    </div>
  </Layout>;
}

function Landing() { return <div className="landing"><div className="landing-grid" /><div className="landing-inner"><div className="landing-brand"><div className="brand-mark"><span /><span /></div><span>IRISMED</span></div><span className="eyebrow-small">EYE RECORD INTELLIGENCE</span><h1>Your eye records,<br /><em>made clear.</em></h1><p>Understand prescriptions, findings and follow-up instructions without having to decode the medical language yourself.</p><div className="landing-actions"><Link to="/dashboard" className="solid-action">Open IrisMed <ArrowRight size={17} /></Link><Link to="/upload" className="outline-action">Upload a record</Link></div><div className="landing-trust"><span><ShieldCheck size={15} /> Source-aware</span><span><FileText size={15} /> PDF · JPG · PNG</span><span><MessageCircle size={15} /> Ask in plain language</span></div></div><div className="landing-rail"><span>IRISMED / 02</span><div className="rail-line" /><span>PRIVATE RECORD WORKSPACE</span></div></div>; }

function App() { return <BrowserRouter><PreferenceLayer><Routes><Route path="/" element={<Landing />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/records" element={<Records />} /><Route path="/records/:id" element={<ReportDetail />} /><Route path="/upload" element={<UploadPage />} /><Route path="/ask" element={<AskIrisMed />} /><Route path="/compare" element={<Compare />} /><Route path="/language" element={<Language />} /><Route path="/settings" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></PreferenceLayer></BrowserRouter>; }

export default App;
