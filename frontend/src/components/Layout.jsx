import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CalendarClock, LayoutDashboard, LogOut, Mail, Send, Settings2, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
const links = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/emails/scheduled', label: 'Scheduled', icon: CalendarClock },
  { to: '/emails/sent', label: 'Sent', icon: Send },
  { to: '/emails/failed', label: 'Failed', icon: XCircle }
];
export function Layout() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  function exit() { logout(); navigate('/login'); }
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark"><Mail size={20}/></span><span>dispatch<span className="brand-period">.</span></span></div><div className="workspace-tag">WORKSPACE</div><div className="workspace-switch"><span className="workspace-dot">{user?.name?.charAt(0)?.toUpperCase()}</span><span className="workspace-copy"><b>{user?.name || 'My workspace'}</b><small>Personal workspace</small></span></div><div className="nav-label">MENU</div><nav className="nav-list">{links.map(({to,label,icon:Icon,...props})=><NavLink to={to} key={to} {...props} className={({isActive})=>`nav-item${isActive?' active':''}`}><Icon size={18}/><span>{label}</span></NavLink>)}</nav><div className="sidebar-bottom"><div className="plan-card"><div className="plan-icon"><Settings2 size={17}/></div><div><b>Starter plan</b><p>Unlimited scheduling</p></div></div><button className="profile-row" onClick={exit}><span className="avatar">{user?.name?.slice(0,1)?.toUpperCase()}</span><span className="profile-copy"><b>{user?.name}</b><small>{user?.email}</small></span><LogOut size={16} className="logout-icon"/></button></div></aside><main className="main-area"><header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span className="crumb-separator">/</span><span className="crumb-current">{links.find((link)=>link.to===window.location.pathname)?.label||'Email management'}</span></div><div className="topbar-actions"><span className="status-pill"><i/> All systems operational</span><span className="top-avatar">{user?.name?.slice(0,1)?.toUpperCase()}</span></div></header><div className="page-wrap"><Outlet/></div></main></div>;
}
