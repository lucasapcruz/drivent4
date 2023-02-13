import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/booking-service";
import enrollmentsService from "@/services/enrollments-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getBookingByUserId(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const booking = await bookingService.getOneByUserId(userId);

    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(error.status).send(error.message);
    }
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

export async function postCreateBooking(req: AuthenticatedRequest, res: Response) {
  try {
    await bookingService.createBooking({
      ...req.body
    });

    return res.sendStatus(httpStatus.OK);
  } catch (error) {
    if (error.name === "Forbidden" || error.name === "OutOfCapacity" || error.name === "NotFoundError") {
      return res.status(error.status).send(error.message);
    }
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}

export async function putUpdateBooking(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req;
    const { bookingId } = req.params;
    const { roomId } = req.body
    await bookingService.updateBooking(parseInt(bookingId),
      {
        userId,
        roomId
      });

    return res.sendStatus(httpStatus.OK);
  } catch (error) {
    console.log(error)
    if (error.name === "Forbidden" || error.name === "OutOfCapacity" || error.name === "NotFoundError") {
      return res.status(error.status).send(error.message);
    }
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}

