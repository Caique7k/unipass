import { PrismaClient, CompanyPlan, EventType, TripStatus, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);
  const now = new Date();

  await prisma.transportEvent.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.rfidCard.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.student.deleteMany();
  await prisma.company.deleteMany();

  const platformAdmin = await prisma.user.create({
    data: {
      name: "Platform Admin",
      email: "platform@unipass.com.br",
      password: passwordHash,
      role: UserRole.PLATFORM_ADMIN,
      active: true,
    },
  });

  const company = await prisma.company.create({
    data: {
      name: "Tavares Transporte",
      cnpj: "12345678000190",
      emailDomain: "tavarestransporte.com.br",
      plan: CompanyPlan.GROWTH,
      contactName: "Caique Alves",
      contactPhone: "+5517988103154",
      smsVerifiedAt: now,
    },
  });

  const secondCompany = await prisma.company.create({
    data: {
      name: "Expresso Horizonte",
      cnpj: "98765432000110",
      emailDomain: "expressohorizonte.com.br",
      plan: CompanyPlan.ESSENTIAL,
      contactName: "Maria Clara",
      contactPhone: "+5511999998888",
      smsVerifiedAt: now,
    },
  });

  const studentAna = await prisma.student.create({
    data: {
      companyId: company.id,
      name: "Ana Tavares",
      registration: "ALU-001",
      email: "ana.tavares@tavarestransporte.com.br",
      phone: "(17) 99111-1111",
      active: true,
    },
  });

  const studentBruno = await prisma.student.create({
    data: {
      companyId: company.id,
      name: "Bruno Alves",
      registration: "ALU-002",
      email: "bruno.alves@tavarestransporte.com.br",
      phone: "(17) 99222-2222",
      active: true,
    },
  });

  const studentCarla = await prisma.student.create({
    data: {
      companyId: secondCompany.id,
      name: "Carla Horizonte",
      registration: "ALU-100",
      email: "carla.horizonte@expressohorizonte.com.br",
      phone: "(11) 98888-7777",
      active: true,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Caique Alves",
      email: "caique.alves@tavarestransporte.com.br",
      password: passwordHash,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  const coordinatorUser = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Maria Operacoes",
      email: "maria.operacoes@tavarestransporte.com.br",
      password: passwordHash,
      role: UserRole.COORDINATOR,
      active: true,
    },
  });

  const driverUser = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Joao Motorista",
      email: "joao.motorista@tavarestransporte.com.br",
      password: passwordHash,
      role: UserRole.DRIVER,
      active: true,
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      companyId: company.id,
      studentId: studentAna.id,
      name: studentAna.name,
      email: studentAna.email!,
      password: passwordHash,
      role: UserRole.USER,
      active: true,
    },
  });

  const busOne = await prisma.bus.create({
    data: {
      companyId: company.id,
      plate: "ABC1D23",
      capacity: 44,
    },
  });

  const busTwo = await prisma.bus.create({
    data: {
      companyId: company.id,
      plate: "XYZ9K87",
      capacity: 36,
    },
  });

  const linkedDevice = await prisma.device.create({
    data: {
      companyId: company.id,
      busId: busOne.id,
      hardwareId: "UNIHUB-TAVARES-001",
      code: "UH-001",
      secret: "SECRET-001",
      name: "UniHub Centro",
      active: true,
      pairedAt: now,
      lastLat: -20.8197,
      lastLng: -49.3794,
      lastUpdate: now,
    },
  });

  const pendingDevice = await prisma.device.create({
    data: {
      hardwareId: "UNIHUB-TAVARES-002",
      pairingCode: "PAIR-002",
      pairingCodeExpiresAt: new Date(now.getTime() + 1000 * 60 * 10),
      active: true,
    },
  });

  const rfidAna = await prisma.rfidCard.create({
    data: {
      companyId: company.id,
      studentId: studentAna.id,
      tag: "RFID-ANA-001",
      active: true,
    },
  });

  const rfidBruno = await prisma.rfidCard.create({
    data: {
      companyId: company.id,
      studentId: studentBruno.id,
      tag: "RFID-BRUNO-002",
      active: true,
    },
  });

  const activeTrip = await prisma.trip.create({
    data: {
      companyId: company.id,
      busId: busOne.id,
      status: TripStatus.ACTIVE,
      startedAt: new Date(now.getTime() - 1000 * 60 * 35),
    },
  });

  await prisma.transportEvent.createMany({
    data: [
      {
        companyId: company.id,
        deviceId: linkedDevice.id,
        studentId: studentAna.id,
        rfidCardId: rfidAna.id,
        tripId: activeTrip.id,
        type: EventType.BOARDING,
        createdAt: new Date(now.getTime() - 1000 * 60 * 12),
      },
      {
        companyId: company.id,
        deviceId: linkedDevice.id,
        studentId: studentBruno.id,
        rfidCardId: rfidBruno.id,
        tripId: activeTrip.id,
        type: EventType.DENIED,
        createdAt: new Date(now.getTime() - 1000 * 60 * 7),
      },
    ],
  });

  console.log("Seed concluido com sucesso.");
  console.log({
    platformAdmin: platformAdmin.email,
    companies: [company.emailDomain, secondCompany.emailDomain],
    users: [adminUser.email, coordinatorUser.email, driverUser.email, studentUser.email],
    students: [studentAna.email, studentBruno.email, studentCarla.email],
    buses: [busOne.plate, busTwo.plate],
    devices: [linkedDevice.hardwareId, pendingDevice.hardwareId],
  });
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
