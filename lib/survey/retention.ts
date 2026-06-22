import type { ContactRequestType } from "./types";

export function calculateSurveySourceExpiry(submittedAt: Date): Date {
  return addMonths(submittedAt, 6);
}

export function calculateContactExpiry(
  requestType: ContactRequestType,
  submittedAt: Date,
  betaProgramEnd?: Date,
): Date {
  if (requestType === "survey_followup") {
    return addMonths(submittedAt, 2);
  }
  if (requestType === "interview") {
    return addDays(submittedAt, 90);
  }
  if (requestType === "pilot") {
    return addYears(submittedAt, 1);
  }

  const twelveMonths = addMonths(submittedAt, 12);
  if (!betaProgramEnd) {
    return twelveMonths;
  }
  const betaEndWindow = addDays(betaProgramEnd, 90);
  return betaEndWindow.getTime() < twelveMonths.getTime() ? betaEndWindow : twelveMonths;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date.getTime());
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next;
}
