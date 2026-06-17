import Image from "next/image";
import EditPunchApplicationPage from "./_components/edit-punch-application-page";

export default function Home() {
    return (
        <>
            <div className="py-0 px-12 pb-6">
                <EditPunchApplicationPage />
            </div>
        </>
    );
}
