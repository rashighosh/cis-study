import { createRoot } from 'react-dom/client'
import './main.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Interaction from './components/Interaction.jsx'
import Landing from './components/Landing.jsx'

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/interaction" element={<Interaction />} />
    </Routes>
  </BrowserRouter>
);