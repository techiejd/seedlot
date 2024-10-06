export async function getUsersByRole(role: string) {
    try {
        const response = await fetch(`/api/user?query=${role}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.users;
    } catch (error) {
        console.error('Error fetching users by role:', error);
        throw error;
    }
}