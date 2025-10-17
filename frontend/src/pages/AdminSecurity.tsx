import { AdminSecurityDashboard } from "@/components/admin/AdminSecurityDashboard";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminSecurity = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        // Check if user is admin
        const { data, error } = await supabase.rpc('is_admin', { user_id_param: user.id });
        
        if (error || !data) {
          toast.error('Access denied: Admin privileges required');
          navigate('/');
          return;
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        navigate('/');
      }
    };

    checkAdminAccess();
  }, [navigate]);

  return <AdminSecurityDashboard />;
};

export default AdminSecurity;