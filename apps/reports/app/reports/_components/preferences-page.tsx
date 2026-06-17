"use client";

export default function PreferencesPage({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  

  return (
    <div className="flex h-full py-4 px-6">
      <div className="flex-1 overflow-y-scroll scroll-hidden">
          {children}
      </div>
    </div>
  );
}
