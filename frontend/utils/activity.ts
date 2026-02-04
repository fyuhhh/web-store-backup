import { API_BASE_URL } from "@/lib/config";

export interface ActivityLogPayload {
    id_user: number;
    nama_pengguna: string; // username
    action_type: string;
    entity_id?: string;
    details?: string; // string or JSON string
}

export const logActivity = async (payload: ActivityLogPayload) => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/activity-logs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: payload.id_user,
                username: payload.nama_pengguna,
                action: payload.action_type,
                details: payload.details,
            }),
        });

        if (!res.ok) {
            console.error("Failed to log activity:", await res.text());
        }
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};
