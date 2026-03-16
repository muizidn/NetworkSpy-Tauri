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
import CertificateInstaller from "./routes/certificate-installer";

import Breakpoint from "./routes/tools/Breakpoint";
import Diffing from "./routes/tools/Diffing";
import Logging from "./routes/tools/Logging";
import Rewrite from "./routes/tools/Rewrite";
import Scripting from "./routes/tools/Scripting";
import Tag from "./routes/tools/Tag";
import WorkspacePage from "./routes/workspace";
import AccountPage from "./routes/account";
import ExtensionsPage from "./routes/extensions";
import SessionPage from "./routes/sessions";
import ViewersPage from "./routes/viewers";
import { SessionProvider } from "./context/SessionContext";
import { ViewerProvider } from "./context/ViewerContext";

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
        path: "/workspace",
        element: <WorkspacePage />,
      },
      {
        path: "/account",
        element: <AccountPage />,
      },
      {
        path: "/extensions",
        element: <ExtensionsPage />,
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
        path: "/certificate-installer",
        element: <CertificateInstaller />,
      },
      {
        path: "/sessions",
        element: <SessionPage />,
      },
      {
        path: "/viewers",
        element: <ViewersPage />,
      },
    ],
  },
]);

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TagProvider } from "./context/TagContext";

import { TrafficListProvider } from "@src/packages/main-content/context/TrafficList";
import { TauriEnvProvider } from "@src/packages/app-env";
import { PaneProvider } from "./context/PaneProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TauriProvider>
      <TagProvider>
        <SessionProvider>
          <ViewerProvider>
            <SettingsProvider>
              <TrafficListProvider>
                <TauriEnvProvider>
                  <PaneProvider>
                    <DndProvider backend={HTML5Backend}>
                      <RouterProvider router={router} />
                    </DndProvider>
                  </PaneProvider>
                </TauriEnvProvider>
              </TrafficListProvider>
            </SettingsProvider>
          </ViewerProvider>
        </SessionProvider>
      </TagProvider>
    </TauriProvider>
  </React.StrictMode>
);
