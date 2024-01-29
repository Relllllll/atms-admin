import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";

const Root = () => {
    return (
        <div className="page-wrapper">
            <Sidebar />
            <Outlet />
        </div>
    );
};

export default Root;
