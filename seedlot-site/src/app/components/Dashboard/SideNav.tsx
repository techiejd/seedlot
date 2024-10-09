"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUserContext } from "@/app/contexts/UserContext";

type Role = "investor" | "manager" | "admin" | "none";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const commonMenuItems: MenuItem[] = [
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
    ...commonMenuItems,
    {
      name: "Go Back Home",
      href: "/",
      icon: "icon here"
    }
  ],
  manager: [
    {
      name: "Apply Manager",
      href: "/dashboard/apply-manager",
      icon: "icon here"
    },
    {
      name: "Orders Available",
      href: "/dashboard/orders-available",
      icon: "icon here"
    },
    ...commonMenuItems,
    {
      name: "Go Back Home",
      href: "/",
      icon: "icon here"
    }
  ],
  admin: [
    ...commonMenuItems,
    {
      name: "Fulfill Orders",
      href: "/dashboard/fulfill-orders",
      icon: "icon here"
    },
    {
      name: "Pending Certifications",
      href: "/dashboard/certifications",
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
  const { userDetails } = useUserContext() as { userDetails: UserDetails | null };
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
      {userDetails && (
        <div className="absolute bottom-0 left-0 w-64 bg-gray-800 text-gray-300 p-2 text-center">
          Role: <b>{userDetails.role.name}</b>
        </div>
      )}
    </div>
  );
};

export default SideNav;
