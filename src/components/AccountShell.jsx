import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ArrowLeft } from 'lucide-react';
import '../styles/account.css';

export function AccountShell({ eyebrow, title, description, children }) {
  return <main className="account-page"><Link className="account-brand" to="/"><span><Sprout size={22}/></span><b>NEXOVANT<small>EXPORTERS</small></b></Link><section className="account-card"><Link className="account-back" to="/"><ArrowLeft size={15}/> Back to website</Link><p className="account-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="account-description">{description}</p>{children}</section><p className="account-foot">© {new Date().getFullYear()} Nexovant Exporters</p></main>;
}
export function DashboardShell({ title, description, children }) {
  return <main className="account-page dashboard-page"><div className="dashboard-top"><Link className="account-brand" to="/"><span><Sprout size={22}/></span><b>NEXOVANT<small>EXPORTERS</small></b></Link><Link className="account-back" to="/">Return to website ↗</Link></div><section className="dashboard-content"><p className="account-eyebrow">CUSTOMER PORTAL</p><h1>{title}</h1><p className="account-description">{description}</p>{children}</section></main>;
}
