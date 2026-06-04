import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Brak tokena autoryzacji." },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const facilityId = searchParams.get("facilityId");

  if (!month || !year || !facilityId) {
    return NextResponse.json(
      { error: "Brak wymaganych parametrów: month, year, facilityId." },
      { status: 400 },
    );
  }

  const backendUrl = new URL(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:2000"}/payroll/export-excel`,
  );

  backendUrl.searchParams.set("month", month);
  backendUrl.searchParams.set("year", year);
  backendUrl.searchParams.set("facilityId", facilityId);

  const backendResponse = await fetch(backendUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    const errorBody = await backendResponse.json().catch(() => ({}));

    return NextResponse.json(
      {
        error:
          errorBody.message ||
          errorBody.error ||
          "Nie udało się wygenerować raportu płacowego.",
      },
      { status: backendResponse.status },
    );
  }

  const fileBuffer = await backendResponse.arrayBuffer();

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        backendResponse.headers.get("content-type") ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        backendResponse.headers.get("content-disposition") ||
        `attachment; filename=Raport_Plac_${month}_${year}.xlsx`,
    },
  });
}
