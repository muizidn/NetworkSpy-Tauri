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
import ScriptList from "./routes/script-list";
import MobileCertificateInstaller from "./routes/certificate-installer/mobile";
import ComputerCertificateInstaller from "./routes/certificate-installer/computer";
import VMCertificateInstaller from "./routes/certificate-installer/vm";
import DevelopmentCertificateInstaller from "./routes/certificate-installer/development";
import ScriptEditor from "./routes/script-editor";

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
        path: "/script-list",
        element: <ScriptList />,
      },
      {
        path: "/script-editor",
        element: <ScriptEditor />,
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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TauriProvider>
      <SettingsProvider>
        <RouterProvider router={router} />
      </SettingsProvider>
    </TauriProvider>
  </React.StrictMode>
);
