import { cn } from '../../../lib/utils';
import Link from 'next/link';
import React from 'react'
import { LayoutDashboard } from 'lucide-react';

function Navigation({navigation,pathname}:{ navigation:any,pathname?:any}) {
  return (
    <nav className="flex-1 overflow-y-auto">
        {navigation.map((group:any, i:number) => (
          <div key={i} className={`px-3 py-2  ${group.mainmenu ? 'border-b border-[#eef2f6]' : ''}`}>
            <h3 className="text-xs font-semibold text-[#4b5563] px-3 mb-2">{group.title}</h3>
            <ul>
              {group.items.map((item:any, j:number) => {
                return (
                  <li key={j}>
                    <Link
                      href={item.href}
                      className={cn(
                      "flex items-center gap-3 px-3 py-1.5 rounded-lg font-medium text-sm primary text-[#4b5563]",
                        pathname === item.href
                          ? "bg-[#eff7ff] text-[#1488fc]"
                          : "hover:bg-[#eff7ff] hover:text-[#1488fc]"
                      )}
                    >
                      <div className='w-6 h-6 flex justify-center'>
                        {item.title === 'Dashboard' ? (
                          <LayoutDashboard className="w-5 h-5" />
                        ) : (
                          item.icon
                        )}
                      </div>
                      <span>{item.title}</span>
                      {item.lasticon && (
                        <span className={cn(
                          "ml-auto h-5 w-5",
                        )}>
                         {item.lasticon}
                        </span>
                      )}
                      {item.badge && (
                        <span className={cn(
                          "ml-auto text-xs px-2 py-0.5 rounded",
                          item.badge === "NEW" 
                            ? "bg-purple-100 text-purple-600"
                            : "bg-gray-100 text-gray-200"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
  )
}

export default Navigation