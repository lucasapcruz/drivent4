import { Router } from "express";
import { authenticateToken, validateBody } from "@/middlewares";
import { getBookingByUserId, postCreateBooking, putUpdateBooking } from "@/controllers/booking-controller";
import { createBookingSchema } from "@/schemas/booking-schema";

const bookingRouter = Router();

bookingRouter
  .all("/*", authenticateToken)
  .get("/", getBookingByUserId)
  .post("/", validateBody(createBookingSchema), postCreateBooking)
  .put("/:bookingId", validateBody(createBookingSchema), putUpdateBooking);

export { bookingRouter };
