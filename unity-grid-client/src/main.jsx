import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Routes from "./components/Routes/Routes";
import Home from "./components/Home/Home";
import SectionPage from "./components/SectionPage";
import { portalSections } from "./data/portalData";
import Login from "./components/pages/Login/Login";
import Register from "./components/pages/Register/Register";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Routes />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      { path: "blood", element: <SectionPage section={portalSections.blood} /> },
      { path: "crisis", element: <SectionPage section={portalSections.crisis} /> },
      { path: "events", element: <SectionPage section={portalSections.events} /> },
      { path: "ledger", element: <SectionPage section={portalSections.ledger} /> },
      {
        path: "/login",
        element: <Login></Login>
      },
      {
        path: "/register",
        element: <Register />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
