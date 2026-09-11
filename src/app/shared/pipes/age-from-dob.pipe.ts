import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ageFromDob' })
export class AgeFromDobPipe implements PipeTransform {
  transform(dob: string | Date | null | undefined): number | null {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : null;
  }
}
