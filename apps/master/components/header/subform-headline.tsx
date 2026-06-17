

const SubformHeadline: React.FC<{ subformHeadline: string }> = ({ subformHeadline }) => {
    return (
        <div className="border-b border-gray-100 px-4 py-3">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {subformHeadline}
            </div>
        </div>
    );
};

export default SubformHeadline;