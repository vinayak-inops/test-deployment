export default function NotificationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className="flex h-full justify-center">
        <div className="flex-1 w-full justify-center overflow-y-scroll px-12 py-0">{children}</div>
    </div>;
}