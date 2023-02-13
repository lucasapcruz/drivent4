import { ApplicationError } from "@/protocols";
import httpStatus from "http-status";

export function outOfCapacityError(): ApplicationErrorWithStatus {
    return {
        name: "OutOfCapacity",
        message: "This room is already out of capacity!",
        status: httpStatus.FORBIDDEN
    };
}

type ApplicationErrorWithStatus = ApplicationError & { status: number }