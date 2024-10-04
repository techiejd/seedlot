"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type Role = "client" | "manager" | "admin";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const commonMenuItems: MenuItem[] = [
  {
    name: "Calculator",
    href: "/dashboard/calculator",
    icon: "icon here"
  },
  {
    name: "My Orders",
    href: "/dashboard/my-orders",
    icon: "icon here"
  },
  {
    name: "All Orders",
    href: "/dashboard/orders",
    icon: "icon here"
  },
];

const menuItems: { [key in Role]: MenuItem[] } = {
  client: [
    ...commonMenuItems,
    {
      name: "Apply to Become a Manager",
      href: "/dashboard/apply-manager",
      icon: "icon here"
    },
  ],
  manager: [
    ...commonMenuItems,
    {
      name: "Certification",
      href: "/dashboard/certification",
      icon: "icon here"
    },
  ],
  admin: [
    ...commonMenuItems,
    {
      name: "Certification",
      href: "/dashboard/certification",
      icon: "icon here"
    },
    {
      name: "Farm Managers",
      href: "/dashboard/managers",
      icon: "icon here"
    },
    {
      name: "Clients",
      href: "/dashboard/clients",
      icon: "icon here"
    },
  ],
};

const SideNav = () => {
  const role = "admin";
  const pathname = usePathname();
  const items = menuItems[role];

  return (
    <div className="bg-gray-900 text-gray-300 w-64 h-screen p-5">
      <Link href={"/"}>
      <Image
          src="/images/seedlot_logo_white.png"
          alt="Seedlot"
          width={200}
          height={80}
          className="mb-8"
        />
      </Link>
      <ul className="list-none p-0">
        {items.map((item) => (
          <li key={item.name} className="mb-2 h-8">
            <Link
              href={item.href}
              className={`flex items-center p-2 rounded ${
                pathname === item.href ? "bg-gray-700" : "bg-transparent"
              } text-gray-300 no-underline`}
            >
              {/* <span className="mr-1 w-[20px]">{item.icon}</span> */}
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SideNav;
