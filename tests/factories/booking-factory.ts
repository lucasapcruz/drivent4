import faker from "@faker-js/faker";
import { prisma } from "@/config";


export async function createBooking(userId: number, roomId: number) {
  const booking = await prisma.booking.create({
    data: {
      userId,
      roomId
    }
  });
  return booking;
}