import { NextResponse, NextRequest } from "next/server";

export const config = {
  // Beskytt alt unntatt Next static-filer og favicon
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get("authorization");
  const adminUser = process.env.BASIC_USER_ADMIN || "";
  const adminPass = process.env.BASIC_PASS_ADMIN || "";
  const tolkUser = process.env.BASIC_USER_TOLK || "";
  const tolkPass = process.env.BASIC_PASS_TOLK || "";

  if (basicAuth) {
    const [scheme, encoded] = basicAuth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const [user, pass] = decoded.split(":");

      // Admin -> sett cookie role=admin
      if (user === adminUser && pass === adminPass) {
        const res = NextResponse.next();
        res.cookies.set("role", "admin", { path: "/" });
        return res;
      }
      // Tolk -> sett cookie role=tolk
      if (user === tolkUser && pass === tolkPass) {
        const res = NextResponse.next();
        res.cookies.set("role", "tolk", { path: "/" });
        return res;
      }
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Tegnsatt prototype"' },
  });
}
