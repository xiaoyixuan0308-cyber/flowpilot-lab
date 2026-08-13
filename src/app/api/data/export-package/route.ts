import { NextResponse } from "next/server";
import { exportUnifiedPackageToExcel } from "@/server/services/export/unified-package-export.service";

function buildAttachmentHeader(fileName: string) {
  const safeAscii = "unified-package-data.xlsx";
  return `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET() {
  const { buffer, fileName } = await exportUnifiedPackageToExcel();

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": buildAttachmentHeader(fileName),
    },
  });
}
