import Image from "next/image";
import OutDutyApplicationPage from "./_components/out-duty-application-page";

export default function Home() {
    return (
        <>
            <div className="py-4 px-12 pb-6">
                <OutDutyApplicationPage />
            </div>
        </>
    );
}
