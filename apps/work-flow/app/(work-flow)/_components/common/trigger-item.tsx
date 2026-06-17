import { Circle, Gem, Link, Square, Timer } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import IconComponent from "@/components/icon/icon-component";
import { TriggerItemProps } from "@/type/work-flow/create-work-flow/props";


export function TriggerItem({
  title,
  onClick,
  description,
  isSelected,
  selectedValue,
}: TriggerItemProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`group w-full justify-start text-left h-auto py-3 px-4 rounded-md transition-all duration-200
                ${
                  selectedValue == title
                    ? "bg-[#344767] hover:bg-[#344767] from-primary to-primary/90 text-primary-foreground shadow-md hover:from-primary/90 hover:to-primary hover:text-white"
                    : "bg-background hover:bg-gradient-to-b hover:from-[#3f3f46] hover:to-[#1b1b1b] hover:backdrop-blur-lg hover:shadow-lg hover:text-white"
                }`}
    >
      <div className="flex gap-3 items-center max-w-full">
        <div>
          <IconComponent icon={"Circle"} size={15} className={"h-4 w-4"} />

          {/* <Image
                    src={avatar || "/placeholder.svg"}
                    alt={`${title}'s avatar`}
                    width={40}
                    height={40}
                    className="rounded-full object-cover ring-2 ring-gray-100"
                  /> */}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`whitespace-nowrap overflow-hidden text-ellipsis text-sm font-semibold transition-colors duration-200 ${
              isSelected ? "text-primary-foreground" : ""
            }`}
          >
            {title}
          </div>
          <div
            className={`text-sm break-words whitespace-normal transition-colors duration-200 ${
              isSelected
                ? "text-primary-foreground/90"
                : "text-[#7b809a] group-hover:text-[#babcc9]"
            }`}
          >
            {description}
          </div>
        </div>
      </div>
    </Button>
  );
}
