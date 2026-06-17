"use client"
import React, { Dispatch, SetStateAction, useState } from "react";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@repo/ui/components/ui/resizable";
import TopTitleDescription from "@repo/ui/components/titleline/top-title-discription";
import SimpleTabs from "./simple-tabs";
import DynamicForm from "@repo/ui/components/form-dynamic/dynamic-form";
import BigPopupWrapper from "@repo/ui/components/popupwrapper/big-popup-wrapper";


const PopupSelecter = ({ pathname, open, setOpen }: { pathname?: string, open: boolean, setOpen:Dispatch<SetStateAction<boolean>> }) => {
    const [selected, setSelected] = useState<string[]>([]);
    return (
        <BigPopupWrapper open={open} setOpen={setOpen}>
            {/* Resizable Panel Group */}
            <ResizablePanelGroup direction="horizontal" className="flex w-full h-full">
                {/* Sidebar */}
                {/* <ResizablePanel 
                    defaultSize={25}
                    minSize={18}
                    maxSize={40}
                    className="bg-gradient-to-b from-gray-50 to-gray-100 border-r flex flex-col py-8 px-0 shadow-md transition-all duration-200 min-w-[200px] max-w-[400px] rounded-tl-2xl rounded-bl-2xl"
                >

                    <div className="flex-1 overflow-y-auto custom-scroll px-2">
                        <LocalPopupNavbar navigation={sidebarNavData} pathname={pathname} selected={selected} setSelected={setSelected} />
                    </div>
                </ResizablePanel> */}
                <ResizableHandle className="bg-gray-300 hover:bg-blue-400 transition-all duration-200" />
                {/* Main Content */}
                <ResizablePanel className="bg-white rounded-r-2xl flex-1 p-6 ">
                    <div className="overflow-y-auto w-full h-full">
                        {/* Selected tags here */}
                        {selected.length > 0 && (<>
                            <div className='px-2 mb-2'>
                                <TopTitleDescription
                                    titleValue={{
                                        title: "Generate Report",
                                        description: "You want to download a report related to your selected topic easily.",
                                    }}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {selected.map(title => (
                                    <span
                                        key={title}
                                        className="inline-flex items-center rounded-full bg-white border border-gray-300 px-4 py-1 text-base font-semibold text-gray-800 shadow-sm hover:shadow-md transition-shadow duration-150"
                                    >
                                        <span className="mr-2 text-sm">{title}</span>
                                        <button
                                            className="ml-1 text-gray-400 hover:text-red-500 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors duration-150 "
                                            onClick={() => setSelected(selected.filter(t => t !== title))}
                                            type="button"
                                            aria-label={`Remove ${title}`}
                                        >
                                            <span className="text-lg leading-none ">×</span>
                                        </button>
                                    </span>
                                ))}
                            </div>

                        </>)}
                        {/* Your main content here */}
                        <SimpleTabs setOpen={setOpen}/>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </BigPopupWrapper>
    );
};

export default PopupSelecter;