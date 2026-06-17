

export default function PreferencesPage({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="">
      {/* <SidebarMini navigation={navContractorEmployee}/> */}
      <div className="">{children}</div>
    </div>
  );
}
