import { ApplicationError } from "@/protocols";
import httpStatus from "http-status";

export function notFoundError(): ApplicationErrorWithStatus {
  return {
    name: "NotFoundError",
    message: "No result for this search!",
    status: httpStatus.NOT_FOUND
  };
}

type ApplicationErrorWithStatus = ApplicationError & { status: number }
