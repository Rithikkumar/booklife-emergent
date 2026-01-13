import ScrollRestoreLayout from "@/components/common/ScrollRestoreLayout";
import { SecuritySettings } from "@/components/security/SecuritySettings";

const Security = () => {
  return (
    <ScrollRestoreLayout scrollKey="security">
      <SecuritySettings />
    </ScrollRestoreLayout>
  );
};

export default Security;