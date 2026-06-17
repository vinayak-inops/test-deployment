export default function NotificationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className="flex h-full">
        <div className="flex-1 overflow-y-scroll px-12 py-4">{children}</div>
    </div>;
}