import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import gsap from "gsap";
import Draggable from "gsap/Draggable";
import { useGSAP } from "@gsap/react";

import "./index.css";
import { App } from "./App.tsx";

gsap.registerPlugin(Draggable);
gsap.registerPlugin(useGSAP);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
