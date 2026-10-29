import { Check, Clock3, LoaderCircle, X } from 'lucide-react';
const config = { scheduled: ['Scheduled', Clock3], processing: ['Sending', LoaderCircle], sent: ['Sent', Check], failed: ['Failed', X], cancelled: ['Cancelled', X] };
export default function StatusBadge({ status }) { const [label, Icon] = config[status] || ['Unknown', Clock3]; return <span className={`status-badge ${status}`}><Icon size={13}/>{label}</span>; }
