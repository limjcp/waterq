"use client";
import React from "react";
import Image from "next/image";

type headerProps = {
  children?: React.ReactNode;

  
};




export default function Header({children}:headerProps) {
    return (

<div className="bg-sky-800 shadow-lg p-0 mb-8 w-full fixed top-0">
        <div className="w-full flex justify-between items-center px-8">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Image src="/wdlogo.png" alt="WD Logo" width={120} height={120} />
        {children}
            
          </div>

          

          
        </div>
      </div>
    );
}