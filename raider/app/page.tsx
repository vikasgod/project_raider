import Footer from "@/components/footer";
import Nav from "@/components/nav";
import PublicHome from "@/components/publicHome";
import { auth } from "./auth";
import PartnerDashboard from "@/components/partnerDashboard";
import AdminDashboard from "@/components/adminDashboard";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import GeoUpdater from "@/components/geoUpdater";

export default async function Home() {
  const session = await auth();
  await connectDB();
  const user = await User.findOne({ email: session?.user?.email });
  const plainUser = JSON.parse(JSON.stringify(user));
  return (
    <div className="w-full min-h-screen bg-white">
      <GeoUpdater userId={plainUser?._id} />
      {plainUser?.role == "partner" ? (
        <>
          <Nav />
          <PartnerDashboard />
        </>
      ) : plainUser?.role == "admin" ? (
        <AdminDashboard />
      ) : (
        <>
          <Nav />
          <PublicHome />
        </>
      )}

      <Footer />
    </div>
  );
}
