import React from "react";
import Container from "@/components/Container";
import Header from "@/components/Header";

const Layout: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="">
      <Header>
        <h1 className="text-6xl font-bold text-white">
          GENERAL SANTOS CITY WATER DISTRICT
        </h1>
      </Header>
      <Container>
          {children}
      </Container>
    </div>
  );
};

export default Layout;