import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function generateUniqueId() {
  return Array.from({ length: 6 }, () => {
      const randomChar = Math.floor(Math.random() * 62);
      return randomChar < 10
          ? String.fromCharCode(randomChar + 48)
          : randomChar < 36
              ? String.fromCharCode(randomChar + 87)
              : String.fromCharCode(randomChar + 29);
  }).join('');
}