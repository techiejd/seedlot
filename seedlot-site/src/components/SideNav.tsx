'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Role = 'client' | 'manager' | 'admin';


interface MenuItem {
    name: string;
    href: string;
    icon: React.ReactNode;
}

interface SideNavProps {
    role: Role;
}

const menuItems: { [key in Role]: MenuItem[] } = {
    client: [
        { name: 'Calculator', href: '/calculator', icon: <svg>/* SVG for Calculator */</svg> },
        { name: 'My Orders', href: '/my-orders', icon: <svg>/* SVG for My Orders */</svg> },
        { name: 'All Orders', href: '/all-orders', icon: <svg>/* SVG for All Orders */</svg> },
        { name: 'Apply to Become a Manager', href: '/apply-manager', icon: <svg>/* SVG for Apply to Become a Manager */</svg> },
    ],
    manager: [
        { name: 'Calculator', href: '/calculator', icon: <svg>/* SVG for Calculator */</svg> },
        { name: 'Certification', href: '/certification', icon: <svg>/* SVG for Certification */</svg> },
        { name: 'My Orders', href: '/my-orders', icon: <svg>/* SVG for My Orders */</svg> },
        { name: 'All Orders', href: '/all-orders', icon: <svg>/* SVG for All Orders */</svg> },
    ],
    admin: [
        { name: 'Calculator', href: '/calculator', icon: <svg>/* SVG for Calculator */</svg> },
        { name: 'Certification', href: '/certification', icon: <svg>/* SVG for Certification */</svg> },
        { name: 'My Orders', href: '/my-orders', icon: <svg>/* SVG for My Orders */</svg> },
        { name: 'All Orders', href: '/all-orders', icon: <svg>/* SVG for All Orders */</svg> },
        { name: 'Managers', href: '/managers', icon: <svg>/* SVG for Managers */</svg> },
        { name: 'Clients', href: '/clients', icon: <svg>/* SVG for Clients */</svg> },
    ],
};

const SideNav: React.FC<SideNavProps> = ({ role }) => {
    const pathname = usePathname();
    const items = menuItems[role];

    return (
        <div style={{ backgroundColor: '#1c2434', color: '#dee4ee', width: '250px', height: '100vh', padding: '20px' }}>
            <h1 style={{ color: '#dee4ee' }}>Seed Lot</h1>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {items.map((item) => (
                    <li key={item.name} style={{ marginBottom: '10px' }}>
                        <Link href={item.href}>
                            <a
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    backgroundColor: pathname === item.href ? '#333a48' : 'transparent',
                                    color: '#dee4ee',
                                    textDecoration: 'none',
                                }}
                            >
                                <span style={{ marginRight: '10px' }}>{item.icon}</span>
                                {item.name}
                            </a>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SideNav;
