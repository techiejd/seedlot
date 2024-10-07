"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUserDetails } from "@/app/hooks/useUserDetails";

type Role = "investor" | "manager" | "admin" | "none";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const commonMenuItems: MenuItem[] = [
  {
    name: "Place Order",
    href: "/dashboard/order",
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
  none: [
    {
      name: "Go Back Home",
      href: "/",
      icon: "icon here"
    }
  ],
  investor: [
    ...commonMenuItems,
    {
      name: "Go Back Home",
      href: "/",
      icon: "icon here"
    }
  ],
  manager: [
    ...commonMenuItems,
    {
      name: "Get Certified",
      href: "/dashboard/certification",
      icon: "icon here"
    },
    {
      name: "Go Back Home",
      href: "/",
      icon: "icon here"
    }
  ],
  admin: [
    ...commonMenuItems,
    {
      name: "Pending Certification",
      href: "/dashboard/certification",
      icon: "icon here"
    },
    {
      name: "Farm Managers",
      href: "/dashboard/managers",
      icon: "icon here"
    },
    {
      name: "Investors",
      href: "/dashboard/investors",
      icon: "icon here"
    },
    {
      name: "Go Back Home",
      href: "/",
      icon: "icon here"
    }
  ],
};

interface UserDetails {
  role: {
    name: Role;
  };
}

const SideNav = () => {
  const { userDetails } = useUserDetails() as { userDetails: UserDetails | null };
  const pathname = usePathname();
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (!userDetails) {
      setItems(menuItems["none"]);
    } else {
      console.log("User details: ", userDetails);
      setItems(menuItems[userDetails.role.name as Role]);
    }
  }, [userDetails]);

  return (
    <div className="bg-gray-900 text-gray-300 w-64 h-screen p-5">
      <Link href={"/dashboard"}>
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
          
            <li key={item.name} className={`mb-2 h-8 ${item.href === "/" ? "mt-8 rounded bg-green-800" : ""}`}>
            <Link
              href={item.href}
              className={`flex items-center p-2 rounded ${
              pathname === item.href ? "bg-gray-700" : item.href === "/" ? "bg-green-800" : "bg-transparent"
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
