import EarningDashboard from "@/components/earningDashboard";

function AdminEarning() {
  return <EarningDashboard endpoint="/api/admin/earning" audience="Admin" />;
}

export default AdminEarning;
