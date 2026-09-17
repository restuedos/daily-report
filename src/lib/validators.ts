import { z } from "zod";

export const manpowerSchema = z.object({
  name: z.string().min(1),
  qualification: z.string().min(1),
  workingHours: z.string().min(1),
  remarks: z.string().optional().nullable(),
  extraJob: z.string().optional().nullable(),
});

export const equipmentSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().min(1),
});

export const reportSchema = z.object({
  projectNo: z.string().min(1),
  projectName: z.string().min(1),
  reportNo: z.string().min(1),
  weekNo: z.string().optional().nullable(),
  reportDate: z.string().min(1),
  companyName: z.string().min(1),
  companyLogoKey: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  clientName: z.string().min(1),
  clientLogoKey: z.string().optional().nullable(),
  arrivalTime: z.string().optional().nullable(),
  leaveTime: z.string().optional().nullable(),
  workDescription: z.string().optional().nullable(),
  activitiesDone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  workEvaluation: z.string().optional().nullable(),
  activitiesNextShift: z.string().optional().nullable(),
  signerName: z.string().optional().nullable(),
  signatureObjectKey: z.string().optional().nullable(),
  signedDate: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "FINAL"]).optional(),
  manpower: z.array(manpowerSchema).default([]),
  equipment: z.array(equipmentSchema).default([]),
  photoKeys: z.array(z.string()).default([]),
});

export const deliveryNoteSchema = z.object({
  noteNumber: z.string().min(1),
  noteDate: z.string().min(1),
  senderName: z.string().min(1),
  receiverName: z.string().min(1),
  driverName: z.string().optional().nullable(),
  vehicleInfo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  signerName: z.string().optional().nullable(),
  signatureKey: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        qty: z.union([z.string(), z.number()]),
        unit: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
      }),
    )
    .default([]),
});
