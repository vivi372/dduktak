import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';

/** 앱 루트: 라우터 연결 (공통 레이아웃은 router의 AppShell이 담당) */
export const App = () => <RouterProvider router={router} />;

export default App;
