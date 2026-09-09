import ReportForm from "../components/ReportForm";

export default function ReportIssue() {
  return (
    <main className="page"><div className="report-shell"><div className="eyebrow">Rapid civic reporting · STX-flow v2.4</div><h1 className="page-title">Report a Civic Issue</h1><p className="page-subtitle">Help municipal dispatch verify, prioritize, and mobilize local infrastructure response crews.</p><div className="progress"><span>✓ STEP 01 · DONE<br/>Category & scope</span><span className="current">02 STEP 02 · ACTIVE<br/>Location & pinpoint</span><span>03 STEP 03<br/>Visual AI verification</span><span>04 STEP 04<br/>Review & submit</span></div><ReportForm /></div></main>
  );
}
