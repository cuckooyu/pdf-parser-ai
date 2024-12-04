import { createRoot } from 'react-dom/client';
import Home from './components/Home';
import './assets/font/iconfont.css';
const root = document.getElementById('root');
if (!root) {
  throw new Error('Could not find root element');
}
createRoot(root).render(<Home />);
