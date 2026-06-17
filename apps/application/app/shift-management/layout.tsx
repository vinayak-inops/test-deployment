import DashboardWrapper from "./_components/dashboard-wrapper";


export default function ManagementLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <div>
        <DashboardWrapper>{children}</DashboardWrapper>
      </div>
    );
  }
  