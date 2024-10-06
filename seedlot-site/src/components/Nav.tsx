import React from 'react';

interface MenuItem {
  [key: string]: string;
}

interface NavProps {
  menuItems?: Array<MenuItem>;
}

const Nav = ({
  menuItems = [{ Home: "/" }, { About: "/about" }],
}: NavProps) => {
  return (
    <nav className="bg-white text-primary h-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <div className="text-primary text-lg font-bold mr-8">Seed Lot</div>
          <div className="hidden md:block">
            <ul className="flex">
              {menuItems.map((item, index) => {
                const key = Object.keys(item)[0];
                const value = item[key];
                return (
                  <li key={index}>
                    <a
                      href={value}
                      className="text-primary hover:bg-primary hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      {key}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="md:hidden">
            <button className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
              Menu
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
