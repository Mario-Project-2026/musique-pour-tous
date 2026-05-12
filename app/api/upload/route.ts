import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { config as authConfig } from "@/app/api/auth/[...nextauth]/route";
import { createTrack } from "@/lib/cosmic";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has artist profile
    const artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!artist || !artist.verified) {
      return NextResponse.json(
        { error: "You need a verified artist profile to upload" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, cloudinary_public_id, duration, cover_image, album_id } = body;

    if (!title || !cloudinary_public_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create track in Cosmic
    const track = await createTrack({
      title,
      metadata: {
        cloudinary_public_id,
        duration,
        cover_image,
        album_id,
        uploaded_by: session.user.email,
        uploaded_from: "artist",
        is_public: true,
      },
    });

    if (!track) {
      return NextResponse.json(
        { error: "Failed to create track" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, track }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
