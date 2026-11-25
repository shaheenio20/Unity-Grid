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
import Departments from "./components/pages/Departments/Departments";
import ClubDetails from "./components/pages/Clubs/ClubDetails";
import Events from "./components/pages/Events/Events";
import BloodBank from "./components/pages/BloodBank/BloodBank";
import CrisisHub from "./components/pages/Crisis/CrisisHub";

const router = createBrowserRouter([
  // Public website routes wrapped with Navbar & Footer
  {
    path: "/",
    element: <Routes />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "clubs/:clubId",
        element: <ClubDetails />,
      },
      {
        path: "events",
        element: <Events />,
      },
      {
        path: "blood",
        element: <BloodBank />,
      },
      {
        path: "crisis",
        element: <CrisisHub initialTab="sos" />,
      },
      {
        path: "ledger",
        element: <CrisisHub initialTab="ledger" />,
      },
      {
        path: "messages",
        element: (
          <SectionPage
            section={{
              title: "Messages & Coordination",
              shortTitle: "Direct Channels",
              description: "Coordinate with volunteers, donors, and campus leads.",
            }}
          />
        ),
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
    ],
  },
  // Dedicated Admin Dashboard routes (NO public Navbar or Footer, Left Sidebar layout)
  {
    path: "/departments",
    element: <Departments />,
  },
  {
    path: "/dashboard/admin",
    element: <Departments />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
