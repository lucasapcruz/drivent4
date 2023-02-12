import { CreateOrUpdateBookingParams } from "@/repositories/booking-repository";
import Joi from "joi";

export const createBookingSchema = Joi.object<CreateOrUpdateBookingParams>({
  roomId: Joi.number().required()
});
