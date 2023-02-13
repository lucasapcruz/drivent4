import { prisma } from "@/config";

async function findById(roomId: number) {
  return prisma.room.findFirst({
    where: { id: roomId },
    select:{
      capacity: true,
      _count: {
        select: {
          Booking: true
        }
      }
    }
  });
}

const roomsRepository = {
  findById,
};

export default roomsRepository;
