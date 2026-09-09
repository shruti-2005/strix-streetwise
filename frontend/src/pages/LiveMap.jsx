import { useEffect, useMemo, useState } from "react";
import IssueMap from "../components/IssueMap";
import IssueCard from "../components/IssueCard";
import { issuesApi } from "../api/api";
import { CATEGORIES } from "../api/categories";

export default function LiveMap() {
  const [issues, setIssues] = useState([]); const [filter, setFilter] = useState("all"); const [location, setLocation] = useState(null);
  useEffect(() => { issuesApi.list({limit:300}).then(({data})=>setIssues(data.issues)).catch(()=>{}); navigator.geolocation?.getCurrentPosition(p=>setLocation([p.coords.latitude,p.coords.longitude]),()=>{}); }, []);
  const shown = useMemo(()=>filter === "all" ? issues : issues.filter(i=>i.category===filter),[issues,filter]);
  return <main className="page"><div className="eyebrow">● Live civic map · real-time telemetry</div><div className="map-layout"><aside className="map-sidebar"><h2>Live Civic Map</h2><p className="text-faint" style={{fontSize:".78rem"}}>{issues.length} active reports across the city</p><input aria-label="Search reports" placeholder="⌕  Search reports, locations" style={{width:"100%",padding:"10px",border:"1px solid var(--line)",borderRadius:7}}/><div className="filter-pills"><button className={`filter-pill ${filter==="all"?"active":""}`} onClick={()=>setFilter("all")}>ALL {issues.length}</button>{CATEGORIES.map(c=><button key={c.value} className={`filter-pill ${filter===c.value?"active":""}`} onClick={()=>setFilter(c.value)}>{c.icon} {c.label}</button>)}</div><div className="map-list">{shown.slice(0,8).map(i=><IssueCard key={i._id} issue={i}/>) || <p>No reports found.</p>}</div></aside><IssueMap issues={shown} userLocation={location} height="650px" /></div></main>;
}
