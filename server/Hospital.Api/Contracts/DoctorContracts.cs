namespace Hospital.Api.Contracts;

public sealed record DepartmentDto(int Id, string Name, string? Description);

public sealed record FeeSchedule(
    decimal Consultation,
    decimal FollowUp,
    decimal Procedure,
    decimal Surgery);

public sealed record DoctorListItemDto(
    int Id,
    string FullName,
    string Specialization,
    int DepartmentId,
    string DepartmentName,
    int ExperienceYears,
    decimal ConsultationFee,
    FeeSchedule Fees,
    double RatingAvg,
    int RatingCount,
    string? Bio);

public sealed record AvailabilityWindowDto(int DayOfWeek, string StartTime, string EndTime, int SlotDurationMinutes);

public sealed record DoctorDetailDto(
    int Id,
    string FullName,
    string Email,
    string Phone,
    string Specialization,
    string? Qualifications,
    int DepartmentId,
    string DepartmentName,
    int ExperienceYears,
    decimal ConsultationFee,
    FeeSchedule Fees,
    double RatingAvg,
    int RatingCount,
    string? Bio,
    IReadOnlyList<AvailabilityWindowDto> Availability);

public sealed record SlotDto(DateTime Start, DateTime End);

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}
