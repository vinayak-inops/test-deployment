import NavigationSection from "./common/navigation-section";
import SidebarHeader from "./common/sidebar-header";
import UserProfile from "./common/user-profile";


const Sidebar = () => {
  return (
    <div className={` w-64 h-full bg-gradient-to-b from-[#3f3f46] to-[#1b1b1b] backdrop-blur-lg shadow-lg text-white flex-col rounded-xl pb-6 flex`}>
        <SidebarHeader />
        <UserProfile />
        <NavigationSection />
    </div>
  );
};

export default Sidebar;
