import { prisma } from "@/config";
import { Booking, Enrollment } from "@prisma/client";

async function findByUserId(userId: number) {
  return prisma.booking.findFirst({
    where: { userId },
    include:{
      Room:true
    }
  });
}

async function findById(id: number) {
  return prisma.booking.findFirst({
    where: { id }
  });
}

async function create(
  createdBooking: CreateOrUpdateBookingParams,
) {
  return prisma.booking.create({
    data: {
      ...createdBooking
    }
  });
}

async function update(
  bookingId: number,
  createdBooking: CreateOrUpdateBookingParams,
) {
  return prisma.booking.update({
    where: {
      id: bookingId
    },
    data: {
      ...createdBooking
    }
  });
}

export type CreateOrUpdateBookingParams = Omit<Booking, "id" | "createdAt" | "updatedAt">;

const bookingRepository = {
  create,
  update,
  findById,
  findByUserId
};

export default bookingRepository;
