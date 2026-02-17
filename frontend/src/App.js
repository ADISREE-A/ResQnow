import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SurvivalMode from "./pages/SurvivalMode";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/survival" element={<SurvivalMode />} />
      </Routes>
    </Router>
  );
}

export default App;
