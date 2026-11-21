
import { useLocation } from "react-router-dom";

import Navbar from "./commponents/Layout/Navbar";
import Footer from "./commponents/Layout/Footer";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const location = useLocation();

  // ==========================================
  // ADMIN PAGES
  // ==========================================

  const isAdminPage =
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/");

  // ==========================================
  // LAYOUT VISIBILITY
  // ==========================================

  const showPublicLayout = !isAdminPage;

  return (
    <>
      {showPublicLayout && <Navbar />}

      <AppRoutes />

      {showPublicLayout && <Footer />}
    </>
  );
}

export default App;
