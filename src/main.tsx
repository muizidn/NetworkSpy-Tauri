import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./layout";
import ErrorPage from "./error-page";
import Home from "./routes/home";
import Settings from "./routes/settings";
import { TauriProvider } from "./context/TauriProvider";
import "./styles.css";
import "./styles/treeview.css";
import "split-pane-react/esm/themes/default.css";
import { SettingsProvider } from "./context/SettingsProvider";
// import ScriptList from "./routes/script-list";
import MobileCertificateInstaller from "./routes/certificate-installer/mobile";
import ComputerCertificateInstaller from "./routes/certificate-installer/computer";
import VMCertificateInstaller from "./routes/certificate-installer/vm";
import DevelopmentCertificateInstaller from "./routes/certificate-installer/development";

import Breakpoint from "./routes/tools/Breakpoint";
import Diffing from "./routes/tools/Diffing";
import Logging from "./routes/tools/Logging";
import Rewrite from "./routes/tools/Rewrite";
import Scripting from "./routes/tools/Scripting";
import Tag from "./routes/tools/Tag";

// import ScriptEditor from "./routes/script-editor";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
      {
        path: "/breakpoint",
        element: <Breakpoint />,
      },
      {
        path: "/diffing",
        element: <Diffing />,
      },
      {
        path: "/logging",
        element: <Logging />,
      },
      {
        path: "/rewrite",
        element: <Rewrite />,
      },
      {
        path: "/scripting",
        element: <Scripting />,
      },
      {
        path: "/tag",
        element: <Tag />,
      },
      {
        path: "/mobile-certificate-installer",
        element: <MobileCertificateInstaller />,
      },
      {
        path: "/computer-certificate-installer",
        element: <ComputerCertificateInstaller />,
      },
      {
        path: "/vm-certificate-installer",
        element: <VMCertificateInstaller />,
      },
      {
        path: "/development-certificate-installer",
        element: <DevelopmentCertificateInstaller />,
      },
    ],
  },
]);

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TagProvider } from "./context/TagContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TauriProvider>
      <TagProvider>
        <SettingsProvider>
          <DndProvider backend={HTML5Backend}>
            <RouterProvider router={router} />
          </DndProvider>
        </SettingsProvider>
      </TagProvider>
    </TauriProvider>
  </React.StrictMode>
);
