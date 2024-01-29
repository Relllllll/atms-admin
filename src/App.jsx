import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Root from "./layout/Root/index.jsx";
import Login from "./pages/Login/Login.jsx";
import Employee from "./pages/Employee/Employee.jsx";
import Register from "./pages/Register/Register.jsx";
import Settings from "./pages/Settings/Settings.jsx";

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
                path: "/register-employee",
                element: <Register />,
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
