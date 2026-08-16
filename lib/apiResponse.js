import { NextResponse } from "next/server";

export function ok(data, init) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created(data) {
  return NextResponse.json(data, { status: 201 });
}

export function error(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function unauthorized(message = "Authentication required") {
  return error(message, 401);
}

export function rateLimited(message = "Too many requests") {
  return error(message, 429);
}

export function notFound(message = "Not found") {
  return error(message, 404);
}
