import DashboardWrapper from "./_components/dashboard-wrapper";

export default function OtManagementLayout({
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
  