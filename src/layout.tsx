import { Outlet, Link, useLocation } from "react-router-dom";
import { AiOutlineSetting, AiOutlineHome } from "react-icons/ai";
import clsx from "clsx";

export default function Layout() {
  const location = useLocation();

  const selectedClass = "text-primary";
  const defaultClass = "w-10 h-7";
  const linkClass = "hover:text-primary w-10 h-10";

  return (
    <div className="flex flex-row min-w-screen min-h-screen overflow-hidden">
      <div className="w-14 bg-base-200 flex flex-col gap-3 px-2 pt-3">
        <Link className={linkClass} to="/">
          <AiOutlineHome
            className={clsx(defaultClass, {
              [selectedClass]: location.pathname === "/",
            })}
          />
        </Link>
        <div className="flex-grow" />
        <Link className={linkClass} to="/settings">
          <AiOutlineSetting
            className={clsx(defaultClass, {
              [selectedClass]: location.pathname === "/settings",
            })}
          />
        </Link>
      </div>
      <div className="w-screen h-screen">
        <Outlet />
      </div>
    </div>
  );
}
