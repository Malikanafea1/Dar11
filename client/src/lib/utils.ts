import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 ج.م";
  
  return new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num) + " ج.م";
}

export function formatDate(date: string | Date, dateSystem: 'gregorian' | 'hijri' = 'gregorian'): string {
  if (!date) {
    return "تاريخ غير محدد";
  }
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Check if the date is valid
  if (!dateObj || typeof dateObj.getTime !== 'function' || isNaN(dateObj.getTime())) {
    return "تاريخ غير صحيح";
  }
  
  if (dateSystem === 'hijri') {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
  }
  
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}

export function formatDateTime(date: string | Date, dateSystem: 'gregorian' | 'hijri' = 'gregorian'): string {
  if (!date) {
    return "تاريخ غير محدد";
  }
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Check if the date is valid
  if (!dateObj || typeof dateObj.getTime !== 'function' || isNaN(dateObj.getTime())) {
    return "تاريخ غير صحيح";
  }
  
  if (dateSystem === 'hijri') {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  }
  
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

export function calculateDaysBetween(startDate: string | Date, endDate?: string | Date): number {
  if (!startDate) return 0;
  
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = endDate ? (typeof endDate === "string" ? new Date(endDate) : endDate) : new Date();
  
  // Check if dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
