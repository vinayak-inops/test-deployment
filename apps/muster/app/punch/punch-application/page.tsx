import Image from "next/image";
import PunchApplicationPage from "./_components/punch-application-page";

export default function Home() {
    return (
        <>
            <div className="py-4 pt-0 px-12 pb-6">
                <PunchApplicationPage />
            </div>
        </>
    );
}
