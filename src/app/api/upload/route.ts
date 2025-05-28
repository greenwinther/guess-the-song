// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

export const config = {
	api: { bodyParser: false }, // disable built-in parser
};

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
	api_key: process.env.CLOUDINARY_API_KEY!,
	api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Helper: upload a Buffer via Cloudinary’s upload_stream
function uploadBuffer(buffer: Buffer, folder: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
			if (err) return reject(err);
			resolve(result!.secure_url);
		});
		streamifier.createReadStream(buffer).pipe(uploadStream);
	});
}

export async function POST(req: Request) {
	// Parse the incoming multipart/form-data
	const formData = await (req as any).formData();
	const file = formData.get("file") as File | null;
	if (!file) {
		return NextResponse.json({ error: "No file provided" }, { status: 400 });
	}

	// Read it into a Buffer
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	try {
		// Upload to the `guess-the-song/backgrounds` folder
		const url = await uploadBuffer(buffer, "guess-the-song/backgrounds");
		return NextResponse.json({ url });
	} catch (err: any) {
		console.error("Upload error:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
