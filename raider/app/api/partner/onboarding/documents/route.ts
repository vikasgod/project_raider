import { auth } from "@/app/auth";
import uploadOnCloudinary from "@/lib/cloudinary";
import connectDB from "@/lib/db";
import PartnerDocs from "@/models/partnerDocs.model";
import User from "@/models/user.model";
import { NextRequest } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
];

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const session = await auth();

        if (!session?.user?.email) {
            return Response.json(
                {
                    message: "Unauthorized",
                },
                {
                    status: 401,
                }
            );
        }

        const user = await User.findOne({
            email: session.user.email,
        });

        if (!user) {
            return Response.json(
                {
                    message: "User not found",
                },
                {
                    status: 404,
                }
            );
        }

        const partnerDocs =
            await PartnerDocs.findOne({
                owner: user._id,
            }).lean();

        if (!partnerDocs) {
            return Response.json(
                {
                    message: "Documents not found",
                },
                {
                    status: 404,
                }
            );
        }

        return Response.json(
            {
                aadharUrl:
                    partnerDocs.aadharUrl ?? null,

                licenseUrl:
                    partnerDocs.licenseUrl ?? null,

                rcUrl:
                    partnerDocs.rcUrl ?? null,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error(
            "Get partner documents error:",
            error
        );

        return Response.json(
            {
                message: "Failed to get partner documents",
            },
            {
                status: 500,
            }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const session = await auth();

        if (!session?.user?.email) {
            return Response.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await User.findOne({
            email: session.user.email,
        });

        if (!user) {
            return Response.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        const formData = await req.formData();

        const aadhar = formData.get(
            "aadhar"
        ) as File | null;

        const license = formData.get(
            "license"
        ) as File | null;

        const rc = formData.get(
            "rc"
        ) as File | null;

        if (!aadhar && !license && !rc) {
            return Response.json(
                { message: "At least one documents is required" },
                { status: 400 }
            );
        }

        const files = [
            {
                name: "Aadhar",
                file: aadhar,
            },
            {
                name: "License",
                file: license,
            },
            {
                name: "RC",
                file: rc,
            },
        ];

        for (const item of files) {
            if (!item.file) {
                continue;
            }

            if (
                !ALLOWED_FILE_TYPES.includes(
                    item.file.type
                )
            ) {
                return Response.json(
                    {
                        message: `${item.name} must be JPG, PNG or PDF`,
                    },
                    {
                        status: 400,
                    }
                );
            }

            if (item.file.size > MAX_FILE_SIZE) {
                return Response.json(
                    {
                        message: `${item.name} size must be less than 10 MB`,
                    },
                    {
                        status: 400,
                    }
                );
            }
        }
        const updatePayload: Record<
            string,
            any
        > = {
            status: "pending",
        };

        if (aadhar) {
            const aadharUrl = await uploadOnCloudinary(aadhar);
            if (!aadharUrl) {
                return Response.json(
                    { message: "Aadhar upload failed" },
                    { status: 500 }
                )
            }
            updatePayload.aadharUrl = aadharUrl;
        }
        if (license) {
            const licenseUrl = await uploadOnCloudinary(license);
            if (!licenseUrl) {
                return Response.json(
                    { message: "license upload failed" },
                    { status: 500 }
                )
            }
            updatePayload.licenseUrl = licenseUrl;
        }

        if (rc) {
            const rcUrl = await uploadOnCloudinary(rc);
            if (!rcUrl) {
                return Response.json(
                    { message: "rc upload failed" },
                    { status: 500 }
                )
            }
            updatePayload.rcUrl = rcUrl;
        }
        const partnerDocs = await PartnerDocs.findOneAndUpdate(
            {
                owner: user._id,
            },
            {
                $set: updatePayload,
            },
            {
                upsert: true,
                new: true,
            }
        );
        user.partnerOnboardingSteps = 2;
        user.partnerStatus = "pending";
        await user.save();
        return Response.json(
            {
                message:
                    "Documents uploaded successfully",
                partnerDocs,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        return Response.json(
            { message: `partner docs error ${error}` },
            { status: 500 }
        )
    }
}