import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node.js APIs are available

interface ConvertError extends Error {
  code?: string;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const outputFilename = `${file.name.replace(/\.[^/.]+$/, "")}.pdf`;

    // Dynamically import CJS module and promisify
    const libreModule = await import("libreoffice-convert").catch((e) => {
      throw new Error(
        "Missing dependency 'libreoffice-convert'. Run: npm i libreoffice-convert"
      );
    });
    const libre: any = (libreModule as any).default || (libreModule as any);
    const { promisify } = await import("util");
    const convertAsync = promisify(libre.convert);

    const pdfBuffer = (await convertAsync(fileBuffer, ".pdf", undefined).catch(
      (err: ConvertError) => {
        // Common case: LibreOffice not installed or not in PATH
        if (err?.message?.toLowerCase().includes("no such file") || err?.code === "ENOENT") {
          throw new Error(
            "LibreOffice is required for conversion but was not found. Install LibreOffice and ensure the 'soffice' binary is in your PATH."
          );
        }
        throw new Error(`Failed to convert file: ${err?.message || err}`);
      }
    )) as Buffer;

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${outputFilename}"`,
      },
    });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Conversion failed" },
      { status: 500 }
    );
  }
}