export type iPermission = {
  id: string;
  created_at: string;
  role: "admin" | "user";
  status: "active" | "resigned";
  member_id: string;
  member: {
    id: string;
    createdAt: string;
    name: string;
    email: string;
  };
};
