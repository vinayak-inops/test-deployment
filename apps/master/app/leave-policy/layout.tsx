
export default function PreferencesPage({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <div className="flex h-full">
        {/* <SidebarMini navigation={navContractorEmployee}/> */}
        <div className="flex-1 overflow-y-scroll py-4">{children}</div>
      </div>
    );
  } 
  