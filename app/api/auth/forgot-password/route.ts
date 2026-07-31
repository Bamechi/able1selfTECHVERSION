export async function POST(request: Request) {
  const payload = (await request.json()) as { email?: string };
  const email = payload.email?.trim() ?? "";

  if (!email || !email.includes("@")) {
    return Response.json(
      { ok: false, error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  return Response.json({
    ok: true,
    message:
      "Reset request received. Email delivery will activate before public launch.",
  });
}
