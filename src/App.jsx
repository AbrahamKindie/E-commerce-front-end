import Navbar from "./commponents/Layout/Navbar";
import Footer from "./commponents/Layout/Footer";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <>
      <Navbar />

      <AppRoutes />

      <Footer />
    </>
  );
}

export default App;