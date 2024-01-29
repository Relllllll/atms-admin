import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";

const Root = () => {
    const location = useLocation();

    const shouldRenderSidebar = location.pathname !== "/";

    return (
        <div className="page-wrapper">
            {shouldRenderSidebar && <Sidebar />}
            <Outlet />
        </div>
    );
};

export default Root;
