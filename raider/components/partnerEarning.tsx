import EarningDashboard from "@/components/earningDashboard";

function PartnerEarning() {
  return <EarningDashboard endpoint="/api/partner/earning" audience="Partner" />;
}

export default PartnerEarning;
