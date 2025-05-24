// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import formidable from "formidable";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const config = { api: { bodyParser: false } };

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
	api_key: process.env.CLOUDINARY_API_KEY!,
	api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
	const form = formidable({ maxFileSize: 5 * 1024 * 1024 });
	// parse and get files
	const { files } = await new Promise<{ fields: any; files: formidable.Files }>((resolve, reject) =>
		form.parse(req as any, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })))
	);

	// force TS to see this as a formidable.File
	const file = (Array.isArray(files.file) ? files.file[0] : files.file) as formidable.File;

	const localPath = file.filepath; // now exists
	const uploadResult: any = await new Promise((res, rej) => {
		cloudinary.uploader.upload(localPath, { folder: "guess-the-song/backgrounds" }, (err, result) =>
			err ? rej(err) : res(result)
		);
	});

	fs.unlinkSync(localPath);
	return NextResponse.json({ url: uploadResult.secure_url });
}
