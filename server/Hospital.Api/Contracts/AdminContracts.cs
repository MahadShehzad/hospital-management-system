using System.ComponentModel.DataAnnotations;
using Hospital.Domain.Enums;

namespace Hospital.Api.Contracts;

// ---- Departments ----
public sealed record SaveDepartmentRequest
{
    [Required, StringLength(120, MinimumLength = 2)]
    public string Name { get; init; } = string.Empty;

    [StringLength(500)] public string? Description { get; init; }
}

// ---- Staff (doctor / receptionist / admin) ----
public sealed record CreateStaffRequest
{
    [Required, StringLength(150, MinimumLength = 3)]
    public string FullName { get; init; } = string.Empty;

    [Required, EmailAddress] public string Email { get; init; } = string.Empty;
    [Required, Phone] public string Phone { get; init; } = string.Empty;
    [Required, StringLength(100, MinimumLength = 8)] public string Password { get; init; } = string.Empty;

    [Required] public UserRole Role { get; init; }

    // Doctor-only fields
    public int? DepartmentId { get; init; }
    [StringLength(150)] public string? Specialization { get; init; }
    [StringLength(300)] public string? Qualifications { get; init; }
    public int ExperienceYears { get; init; }
    public decimal ConsultationFee { get; init; }
    public decimal FollowUpFee { get; init; }
    public decimal ProcedureFee { get; init; }
    public decimal SurgeryFee { get; init; }
    [StringLength(1000)] public string? Bio { get; init; }
}

public sealed record UpdateStaffRequest
{
    [Required, StringLength(150, MinimumLength = 3)]
    public string FullName { get; init; } = string.Empty;

    [Required, Phone] public string Phone { get; init; } = string.Empty;
    public bool IsActive { get; init; } = true;

    public int? DepartmentId { get; init; }
    [StringLength(150)] public string? Specialization { get; init; }
    [StringLength(300)] public string? Qualifications { get; init; }
    public int? ExperienceYears { get; init; }
    public decimal? ConsultationFee { get; init; }
    public decimal? FollowUpFee { get; init; }
    public decimal? ProcedureFee { get; init; }
    public decimal? SurgeryFee { get; init; }
    [StringLength(1000)] public string? Bio { get; init; }
}

public sealed record StaffDto(
    int UserId,
    int? DoctorId,
    string FullName,
    string Email,
    string Phone,
    UserRole Role,
    bool IsActive,
    string? Specialization,
    int? DepartmentId,
    string? DepartmentName,
    int? ExperienceYears,
    decimal? ConsultationFee,
    decimal? FollowUpFee,
    decimal? ProcedureFee,
    decimal? SurgeryFee,
    DateTime CreatedAt);

public sealed record CreatedStaffDto(StaffDto Staff, string TemporaryPassword);
