import PredefinedPropertiesTable from "./_components/predefined-properties-table";
// import PredefinedPropertiesHeadline from "./_components/predefined-properties-headline"

function PredefinedProperties() {
    return (
        <div className="space-y-6">
            {/* <div className="flex items-start justify-between">
                <PredefinedPropertiesHeadline />
            </div> */}
            <PredefinedPropertiesTable />
        </div>
    )
}

export default PredefinedProperties