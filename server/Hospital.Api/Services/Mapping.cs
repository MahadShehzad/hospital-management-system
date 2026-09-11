using System.Linq.Expressions;
using Hospital.Api.Contracts;
using Hospital.Domain.Entities;

namespace Hospital.Api.Services;

/// <summary>Shared EF-translatable projections so DTO shapes stay consistent.</summary>
public static class Mapping
{
    public static readonly Expression<Func<Appointment, AppointmentDto>> Appointment = a => new AppointmentDto(
        a.Id,
        a.DoctorId,
        a.Doctor.User.FullName,
        a.Doctor.Specialization,
        a.PatientId,
        a.Patient.User.FullName,
        a.ScheduledStart,
        a.ScheduledEnd,
        a.Status,
        a.Reason,
        a.CancelledReason,
        a.Doctor.ConsultationFee,
        a.CreatedAt);

    public static int? AgeFrom(DateOnly? dob)
    {
        if (dob is not { } d) return null;
        var today = DateOnly.FromDateTime(DateTime.Now);
        var age = today.Year - d.Year;
        if (d > today.AddYears(-age)) age--;
        return age < 0 ? null : age;
    }
}
