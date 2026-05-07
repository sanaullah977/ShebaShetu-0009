import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/lib/role-store";

const Index = () => {
  const navigate = useNavigate();
  const { role } = useRole();
  useEffect(() => {
    const map = { patient: "/patient", reception: "/reception", doctor: "/doctor" } as const;
    navigate(map[role], { replace: true });
  }, [navigate, role]);
  return null;
};

export default Index;
