import { useEffect } from "react";
import { useSelector } from "react-redux";

import { getHealth } from "./api/health";
import type { RootState } from "./store";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const serverStatus = useSelector((state: RootState) => state.serverStatus);

  useEffect(() => {
    const checkServer = () => {
      getHealth().catch(() => {});
    };

    checkServer();

    const interval = window.setInterval(checkServer, 5 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className='flex min-h-screen flex-col bg-muted/30'>
      <Header />

      <main className='flex-1'>
        {serverStatus.status === "OFFLINE" ? (
          <div className='flex min-h-[calc(100vh-8rem)] items-center justify-center px-4'>
            <div className='text-center'>
              <h2 className='text-xl font-semibold'>Server Unavailable</h2>

              <p className='mt-2 text-sm text-muted-foreground'>
                The server is currently unavailable. Please try again later.
              </p>
            </div>
          </div>
        ) : (
          <AppRoutes />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
