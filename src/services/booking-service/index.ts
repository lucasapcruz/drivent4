import { notFoundError } from "@/errors";
import { forbiddenError } from "@/errors/forbidden-access-error";
import { outOfCapacityError } from "@/errors/out-of-capacity-error";
import bookingRepository, { CreateOrUpdateBookingParams } from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import roomsRepository from "@/repositories/room-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { exclude } from "@/utils/prisma-utils";
import { Booking } from "@prisma/client";

async function getOneByUserId(userId: number): Promise<GetOneByUserIdResult> {
  const booking = await bookingRepository.findByUserId(userId);

  if (!booking) {
    throw notFoundError();
  }

  return {
    ...exclude(booking, "roomId", "userId", "createdAt", "updatedAt"),
  };
}

type GetOneByUserIdResult = Omit<Booking,  "roomId" | "userId" | "createdAt" | "updatedAt">;
type CreatedOrUpdatedBooking = Omit<GetOneByUserIdResult, "roomId">;

async function checkRoomIdExistenceAndCapacity(roomId: number) {
  const room = await roomsRepository.findById(roomId);
  if (!room) {
    throw notFoundError();
  }
  if (room.capacity <= room._count.Booking) {
    throw outOfCapacityError();
  }
}

async function checkUserTicket(userId: number) {

  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

  if (!enrollment) {
    throw forbiddenError();
  }

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);

  if (!ticket || !ticket.TicketType.includesHotel || ticket.TicketType.isRemote || !(ticket.status === "PAID")) {
    throw forbiddenError();
  }
}

async function createBooking(params: CreateOrUpdateBookingParams): Promise<CreatedOrUpdatedBooking> {

  await checkUserTicket(params.userId)

  await checkRoomIdExistenceAndCapacity(params.roomId)

  const newBooking = await bookingRepository.create(params.userId, params.roomId)

  return ({
    id: newBooking.id
  })
}

async function updateBooking(bookingId: number, params: CreateOrUpdateBookingParams): Promise<CreatedOrUpdatedBooking> {

  const booking = await bookingRepository.findById(bookingId)

  if (!booking || booking.userId !== params.userId) {
    throw forbiddenError();
  }

  await checkRoomIdExistenceAndCapacity(params.roomId)

  const updatedBooking = await bookingRepository.update(bookingId, params.userId, params.roomId);

  return ({
    id: bookingId
  })
}

const bookingService = {
  createBooking,
  updateBooking,
  getOneByUserId
};

export default bookingService;
