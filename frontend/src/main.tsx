import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ModalProvider } from "./providers/ModalProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <ModalProvider>
    <App />
  </ModalProvider>,
);
