import { prisma } from "@/config";
import { Booking, Enrollment } from "@prisma/client";

async function findById(roomId: number) {
  return prisma.room.findFirst({
    where: { id: roomId }
  });
}

const roomsRepository = {
  findById,
};

export default roomsRepository;
