import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Root from "./layout/Root/index.jsx";
import Login from "./pages/Login/Login.jsx";
import Employee from "./pages/Employee/Employee.jsx";
import Register from "./pages/Register/Register.jsx";
import Settings from "./pages/Settings/Settings.jsx";
import Logs from "./pages/Logs/Logs.jsx";
import EmployeeDetails from "./pages/EmployeeDetails/EmployeeDetails.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            {
                path: "/",
                element: <Login />,
            },
            {
                path: "/employee-list",
                element: <Employee />,
            },
            {
                path: "/employee-details/:id",
                element: <EmployeeDetails />,
            },
            {
                path: "/register-employee",
                element: <Register />,
            },
            {
                path: "/logs",
                element: <Logs />,
            },
            {
                path: "/settings",
                element: <Settings />,
            },
        ],
    },
]);

const App = () => {
    return <RouterProvider router={router} />;
};

export default App;
