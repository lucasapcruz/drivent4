import app, { init } from "@/app";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import { create } from "domain";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import {
  createUser,
  createHotel,
  createRoomWithHotelId,
  createBooking,
  createEnrollmentWithAddress,
  createTicket,
  createTicketType,
  createTicketTypeRemote,
  createTicketTypeWithHotel,
  createTicketTypeInPeronWithoutHotel
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 200 and the booking information, if the user has a booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = createEnrollmentWithAddress(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, room.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        id: booking.id,
        Room: {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          hotelId: room.hotelId,
          updatedAt: room.updatedAt.toISOString(),
          createdAt: room.createdAt.toISOString()
        },
      });
    });

    it("should respond with status 404 if the user doesn't have a booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = createEnrollmentWithAddress(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
  })
});

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 403 if user doesn't have an enrollment", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const payload = { roomId: room.id }
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(payload);

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 if user doesn't have a ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const payload = { roomId: room.id }
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(payload);

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    describe("when user is enrolled and have a ticket", () => {

      it("should respond with status 403 if the ticket is remote", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const ticketType = await createTicketTypeRemote();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
        const payload = { roomId: room.id }
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(payload);

        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      describe("when the ticket is of type: in person", () => {

        it("should respond with status 403 if the ticket has no accomodation", async () => {
          const user = await createUser();
          const token = await generateValidToken(user);
          const enrollment = await createEnrollmentWithAddress(user);
          const hotel = await createHotel();
          const room = await createRoomWithHotelId(hotel.id);
          const ticketType = await createTicketTypeInPeronWithoutHotel();
          const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
          const payload = { roomId: room.id }
          const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(payload);

          expect(response.status).toEqual(httpStatus.FORBIDDEN);
        });

        describe("when the ticket has accomodation", () => {

          it("should respond with status 403 if the ticket isn't PAID", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED)
            const payload = { roomId: room.id }
            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(payload);

            expect(response.status).toEqual(httpStatus.FORBIDDEN);
          });

          describe("when the ticket is PAID", () => {

            it("should respond with status 404 if roomId doesn't exist", async () => {
              const user = await createUser();
              const token = await generateValidToken(user);
              const enrollment = await createEnrollmentWithAddress(user);
              const hotel = await createHotel();
              const room = await createRoomWithHotelId(hotel.id);
              const randomRoom = faker.datatype.number({ min: 10, max: 30 })
              const ticketType = await createTicketTypeWithHotel();
              const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
              const payload = { roomId: randomRoom }
              const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(payload);

              expect(response.status).toEqual(httpStatus.NOT_FOUND);
            });

            describe("when the roomId exists", () => {

              it("should respond with status 403 if room is full", async () => {
                const user1 = await createUser();
                const user2 = await createUser();
                const user3 = await createUser();
                const user4 = await createUser();
                const token = await generateValidToken(user1);
                const enrollment = await createEnrollmentWithAddress(user1);
                const hotel = await createHotel();
                const room = await createRoomWithHotelId(hotel.id);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
                const booking2 = await createBooking(user2.id, room.id);
                const booking3 = await createBooking(user3.id, room.id);
                const booking4 = await createBooking(user4.id, room.id);
                const payload = { roomId: room.id }
                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(payload);

                expect(response.status).toEqual(httpStatus.FORBIDDEN);
              });

              it("should respond with status 200 and the bookingId if succeeded to create booking", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const hotel = await createHotel();
                const room = await createRoomWithHotelId(hotel.id);
                const ticketType = await createTicketTypeWithHotel();
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
                const payload = { roomId: room.id }
                const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(payload);

                expect(response.status).toEqual(httpStatus.OK);
                expect(response.body).toEqual({bookingId: expect.any(Number)})
              });
            });
          });
        });
      });
    });
  });
});

describe("PUT /booking/:bookingId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const id = faker.datatype.number(20)
    const response = await server.put(`/booking/${id}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    const id = faker.datatype.number(20)
    const response = await server.put(`/booking/${id}`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const id = faker.datatype.number(20)
    const response = await server.put(`/booking/${id}`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {

    it("should respond with status 403 if user doesn't have a booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const payload = { roomId: room.id }
      const id = faker.datatype.number(20)
      const response = await server.put(`/booking/${id}`).set("Authorization", `Bearer ${token}`).send(payload);

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    describe("when user have a booking", () => {

      it("should respond with status 404 if roomId doesn't exist", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const randomRoom = faker.datatype.number({ min: 10, max: 30 })
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
        const booking = await createBooking(user.id, room.id);
        const payload = { roomId: randomRoom }
        const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(payload);

        expect(response.status).toEqual(httpStatus.NOT_FOUND);
      });

      describe("when the roomId exists", () => {

        it("should respond with status 403 if room is full", async () => {
          const user1 = await createUser();
          const user2 = await createUser();
          const user3 = await createUser();
          const user4 = await createUser();
          const token = await generateValidToken(user1);
          const enrollment = await createEnrollmentWithAddress(user1);
          const hotel = await createHotel();
          const room1 = await createRoomWithHotelId(hotel.id);
          const room2 = await createRoomWithHotelId(hotel.id);
          const ticketType = await createTicketTypeWithHotel();
          const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
          const booking1 = await createBooking(user1.id, room1.id);
          const booking2 = await createBooking(user2.id, room2.id);
          const booking3 = await createBooking(user3.id, room2.id);
          const booking4 = await createBooking(user4.id, room2.id);
          const payload = { roomId: room2.id }
          const response = await server.put(`/booking/${booking1.id}`).set("Authorization", `Bearer ${token}`).send(payload);

          expect(response.status).toEqual(httpStatus.FORBIDDEN);
        });

        it("should respond with status 200 and the bookingId if succeeded to update booking", async () => {
          const user1 = await createUser();
          const token = await generateValidToken(user1);
          const enrollment = await createEnrollmentWithAddress(user1);
          const hotel = await createHotel();
          const room1 = await createRoomWithHotelId(hotel.id);
          const room2 = await createRoomWithHotelId(hotel.id);
          const ticketType = await createTicketTypeWithHotel();
          const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
          const booking1 = await createBooking(user1.id, room1.id);
          const payload = { roomId: room2.id }
          const response = await server.put(`/booking/${booking1.id}`).set("Authorization", `Bearer ${token}`).send(payload);

          expect(response.status).toEqual(httpStatus.OK);
          expect(response.body).toEqual({bookingId: expect.any(Number)})
        });
      });
    });
  });
});