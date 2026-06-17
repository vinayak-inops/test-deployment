
import Aiwrapper from "@/components/ai/ai-wrapper";

export default function PreferencesPage({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <div className="">
        {children}
        <Aiwrapper />
      </div>
    );
  }
  