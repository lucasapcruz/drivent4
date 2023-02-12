import { ApplicationError } from "@/protocols";
import httpStatus from "http-status";

export function forbiddenError(): ApplicationErrorWithStatus {
  return {
    name: "Forbidden",
    message: "User must have a paid ticket for an in-person event",
    status: httpStatus.FORBIDDEN
  };
}

type ApplicationErrorWithStatus = ApplicationError & { status: number }