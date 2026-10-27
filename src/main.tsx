import {createRoot} from 'react-dom/client';
import CRM from './crm';
import {startUpdateCheck} from './app-update';
import {startSync} from './sync-state';
import './globals.css';
createRoot(document.getElementById('root')!).render(<CRM/>);
startUpdateCheck();
startSync().catch(()=>{});
