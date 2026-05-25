import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidPesel(pesel: string): boolean {
  if (!/^\d{11}$/.test(pesel)) {
    return false;
  }

  const weight = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(pesel.charAt(i)) * weight[i];
  }

  const checksum = (10 - (sum % 10)) % 10;
  return parseInt(pesel[10]) === checksum;
}
