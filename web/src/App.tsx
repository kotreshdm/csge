import { useEffect } from "react";
import { useSelector } from "react-redux";

import { getHealth } from "./api/health";
import type { RootState } from "./store";

function App() {
  const serverStatus = useSelector((state: RootState) => state.serverStatus);

  useEffect(() => {
    const checkServer = () => {
      getHealth().catch(() => {
        // Redux status is updated inside client.ts
      });
    };

    // Initial check
    checkServer();

    // Every 5 minutes
    const interval = window.setInterval(checkServer, 5 * 60 * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <h1>Member Management</h1>

      {serverStatus.status === "OFFLINE" ? (
        <div>
          <h2>Server Unavailable</h2>
          <p>The server is currently unavailable. Please try again later.</p>
        </div>
      ) : (
        <p>API Status: {serverStatus.message}</p>
      )}
    </div>
  );
}

export default App;
