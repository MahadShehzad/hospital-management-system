namespace Hospital.Api.Contracts;

public sealed record DoctorDashboardDto(
    string DoctorName,
    int TodayTotal,
    int TodayCompleted,
    int TodayPending,
    int UpcomingTotal,
    int WaitingInQueue,
    IReadOnlyList<AppointmentDto> Today,
    IReadOnlyList<AppointmentDto> Upcoming);

public sealed record ReceptionDashboardDto(
    int TodayAppointments,
    int TodayCheckedIn,
    int WaitingInQueue,
    int UnpaidInvoices,
    decimal TodayRevenue,
    IReadOnlyList<AppointmentDto> TodaySchedule);

public sealed record AdminReportDto(
    int TotalPatients,
    int TotalDoctors,
    int TotalStaff,
    int AppointmentsThisMonth,
    int AppointmentsToday,
    decimal RevenueThisMonth,
    decimal RevenueToday,
    int UnpaidInvoices,
    IReadOnlyList<StatusCountDto> AppointmentsByStatus,
    IReadOnlyList<DoctorPerformanceDto> DoctorPerformance,
    IReadOnlyList<DailyCountDto> AppointmentsTrend,
    IReadOnlyList<DepartmentCountDto> PatientsByDepartment);

public sealed record StatusCountDto(string Status, int Count);
public sealed record DailyCountDto(DateOnly Date, int Count);
public sealed record DepartmentCountDto(string Department, int Count);

public sealed record DoctorPerformanceDto(
    int DoctorId,
    string DoctorName,
    string Specialization,
    int TotalAppointments,
    int Completed,
    int NoShow,
    int Cancelled,
    double RatingAvg,
    decimal Revenue);
