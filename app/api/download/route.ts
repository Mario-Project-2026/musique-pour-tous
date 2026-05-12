import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { config as authConfig } from "@/app/api/auth/[...nextauth]/route";
import { getCloudinaryDownloadUrl } from "@/lib/cloudinary";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("id");
    const filename = searchParams.get("filename") || "track.mp3";

    if (!publicId) {
      return NextResponse.json(
        { error: "Missing track ID" },
        { status: 400 }
      );
    }

    const downloadUrl = getCloudinaryDownloadUrl(publicId, filename);

    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
