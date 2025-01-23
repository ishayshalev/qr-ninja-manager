import { useLocation } from "react-router-dom";

export function TopBar() {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Overview";
      case "/settings":
        return "Settings";
      case "/billing":
        return "Billing";
      default:
        return "Overview";
    }
  };

  return (
    <div className="flex items-center justify-between border-b bg-background py-4 px-4">
      <h1 className="text-2xl font-semibold">{getPageTitle()}</h1>
    </div>
  );
}