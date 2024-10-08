import React from 'react';
import { useUserDetails } from '@/app/hooks/useUserDetails';

const AdminDashboard: React.FC = () => {
    const { userDetails } = useUserDetails();

    if (userDetails.role !== "admin") {
        return <div>Restricted Page</div>;
    }

    return (
        <div>
            <h1>Admin Dashboard</h1>
            <button onClick={() => console.log('Program Initialized')}>Initialize Program</button>
        </div>
    );
};

export default AdminDashboard;