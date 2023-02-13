import { prisma } from "@/config";
import { Booking } from "@prisma/client";

async function findByUserId(userId: number) {
  return prisma.booking.findFirst({
    where: { userId },
    include: {
      Room: true
    }
  });
}

async function findById(id: number) {
  return prisma.booking.findFirst({
    where: { id }
  });
}

async function create(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId
    }
  });
}

async function update(
  bookingId: number,
  userId: number,
  roomId: number
) {
  return prisma.booking.update({
    where: {
      id: bookingId
    },
    data: {
      roomId
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
