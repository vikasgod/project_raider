import { auth } from "@/app/auth";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import { NextRequest } from "next/server";

const VEHICLE_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,2}[0-9]{4}$/;

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session || !session.user?.email) {
      return Response.json(
        {
          message: "unauthorized",
        },
        { status: 400 },
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json(
        {
          message: "User not found",
        },
        { status: 400 },
      );
    }

    const { type, number, vehicleModel } = await req.json();
    if (!type || !number || !vehicleModel) {
      return Response.json(
        {
          message: "missing required details",
        },
        { status: 400 },
      );
    }

    if (!VEHICLE_REGEX.test(String(number).toUpperCase())) {
      return Response.json(
        {
          message: "Invalid Vehicle Number Format",
        },
        { status: 400 },
      );
    }

    const vehicleNumber = String(number).toUpperCase();

    let vehicle = await Vehicle.findOne({ owner: user._id });
    if (vehicle) {
      vehicle.type = type;
      vehicle.number = vehicleNumber;
      vehicle.vehicleModel = vehicleModel;
      vehicle.status = "pending";
      await vehicle.save();

      if (user.partnerOnboardingSteps < 2) {
        user.partnerOnboardingSteps = 1;
        user.partnerStatus = "pending";

        await user.save();
      } else {
        user.partnerOnboardingSteps = 3;
        user.partnerStatus = "pending";

        await user.save();
      }

      return Response.json(vehicle, { status: 200 });
    }
    const duplicate = await Vehicle.findOne({ number: vehicleNumber });
    if (duplicate) {
      return Response.json(
        {
          message: "Vehicle already registered",
        },
        { status: 400 },
      );
    }
    vehicle = await Vehicle.create({
      owner: user._id,
      type,
      number: vehicleNumber,
      vehicleModel,
      status: "pending",
    });

    if (user.partnerOnboardingSteps < 1) {
      user.partnerOnboardingSteps = 1;
    }
    user.role = "partner";
    user.partnerStatus = "pending";
    await user.save();
    return Response.json(vehicle, { status: 201 });
  } catch (error) {
    console.log("error", error);
    return Response.json(
      {
        message: `Vehicle error ${error}`,
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session || !session.user?.email) {
      return Response.json(
        {
          message: "unauthorized",
        },
        { status: 400 },
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json(
        {
          message: "User not found",
        },
        { status: 400 },
      );
    }

    const vehicle = await Vehicle.findOne({ owner: user._id });
    if (vehicle) {
      return Response.json(vehicle, { status: 200 });
    }

    return Response.json({ message: "Vehicle not found" }, { status: 404 });
  } catch (error) {
    return Response.json(
      { message: `get vehicle error ${error}` },
      { status: 500 },
    );
  }
}
