using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<DoctorAvailability> DoctorAvailabilities => Set<DoctorAvailability>();
    public DbSet<DoctorAvailabilityException> DoctorAvailabilityExceptions => Set<DoctorAvailabilityException>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<AppointmentStatusHistory> AppointmentStatusHistories => Set<AppointmentStatusHistory>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<PrescriptionItem> PrescriptionItems => Set<PrescriptionItem>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<PatientReport> PatientReports => Set<PatientReport>();
    public DbSet<QueueEntry> QueueEntries => Set<QueueEntry>();
    public DbSet<Holiday> Holidays => Set<Holiday>();
    public DbSet<ClinicSetting> ClinicSettings => Set<ClinicSetting>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.Property(x => x.FullName).HasMaxLength(150).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(30);
            e.Property(x => x.Role).HasConversion<int>();
            e.HasIndex(x => x.Email).IsUnique();
        });

        b.Entity<RefreshToken>(e =>
        {
            e.Property(x => x.TokenHash).HasMaxLength(200).IsRequired();
            e.Property(x => x.ReplacedByTokenHash).HasMaxLength(200);
            e.HasIndex(x => x.TokenHash);
            e.HasOne(x => x.User).WithMany(u => u.RefreshTokens)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.Ignore(x => x.IsActive);
        });

        b.Entity<Department>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
            e.Property(x => x.Description).HasMaxLength(500);
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<Doctor>(e =>
        {
            e.Property(x => x.Specialization).HasMaxLength(150).IsRequired();
            e.Property(x => x.Qualifications).HasMaxLength(300);
            e.Property(x => x.Bio).HasMaxLength(1000);
            e.Property(x => x.ConsultationFee).HasPrecision(10, 2);
            e.Property(x => x.FollowUpFee).HasPrecision(10, 2);
            e.Property(x => x.ProcedureFee).HasPrecision(10, 2);
            e.Property(x => x.SurgeryFee).HasPrecision(10, 2);
            e.HasIndex(x => x.UserId).IsUnique();
            e.HasOne(x => x.User).WithOne(u => u.Doctor)
                .HasForeignKey<Doctor>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Department).WithMany(d => d.Doctors)
                .HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Patient>(e =>
        {
            e.Property(x => x.BloodGroup).HasMaxLength(5);
            e.Property(x => x.Address).HasMaxLength(300);
            e.Property(x => x.EmergencyContact).HasMaxLength(30);
            e.Property(x => x.Gender).HasConversion<int?>();
            e.HasIndex(x => x.UserId).IsUnique();
            e.HasOne(x => x.User).WithOne(u => u.Patient)
                .HasForeignKey<Patient>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<DoctorAvailability>(e =>
        {
            e.Property(x => x.DayOfWeek).HasConversion<int>();
            e.HasOne(x => x.Doctor).WithMany(d => d.Availabilities)
                .HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.DoctorId, x.DayOfWeek });
        });

        b.Entity<DoctorAvailabilityException>(e =>
        {
            e.HasOne(x => x.Doctor).WithMany(d => d.AvailabilityExceptions)
                .HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.DoctorId, x.Date }).IsUnique();
        });

        b.Entity<Appointment>(e =>
        {
            e.Property(x => x.Reason).HasMaxLength(500);
            e.Property(x => x.CancelledReason).HasMaxLength(500);
            e.Property(x => x.Status).HasConversion<int>();
            e.HasOne(x => x.Patient).WithMany(p => p.Appointments)
                .HasForeignKey(x => x.PatientId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Doctor).WithMany(d => d.Appointments)
                .HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Restrict);

            // Double-booking guard: a doctor can hold at most one non-cancelled
            // appointment at any given start time.
            e.HasIndex(x => new { x.DoctorId, x.ScheduledStart })
                .IsUnique()
                .HasFilter("[Status] <> 3");

            e.HasIndex(x => new { x.DoctorId, x.ScheduledStart, x.ScheduledEnd });
        });

        b.Entity<AppointmentStatusHistory>(e =>
        {
            e.Property(x => x.FromStatus).HasConversion<int?>();
            e.Property(x => x.ToStatus).HasConversion<int>();
            e.Property(x => x.Note).HasMaxLength(500);
            e.HasOne(x => x.Appointment).WithMany(a => a.StatusHistory)
                .HasForeignKey(x => x.AppointmentId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Prescription>(e =>
        {
            e.Property(x => x.Diagnosis).HasMaxLength(1000);
            e.Property(x => x.Notes).HasMaxLength(2000);
            e.HasOne(x => x.Appointment).WithOne(a => a.Prescription)
                .HasForeignKey<Prescription>(x => x.AppointmentId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.AppointmentId).IsUnique();
        });

        b.Entity<PrescriptionItem>(e =>
        {
            e.Property(x => x.MedicineName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Dosage).HasMaxLength(100);
            e.Property(x => x.Frequency).HasMaxLength(100);
            e.Property(x => x.Instructions).HasMaxLength(500);
            e.HasOne(x => x.Prescription).WithMany(p => p.Items)
                .HasForeignKey(x => x.PrescriptionId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Invoice>(e =>
        {
            e.Property(x => x.Number).HasMaxLength(30).IsRequired();
            e.Property(x => x.Notes).HasMaxLength(1000);
            e.Property(x => x.Status).HasConversion<int>();
            e.Property(x => x.PaymentMethod).HasConversion<int?>();
            e.Property(x => x.Discount).HasPrecision(10, 2);
            e.Property(x => x.TaxRate).HasPrecision(5, 2);
            e.HasIndex(x => x.Number).IsUnique();
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Appointment).WithMany().HasForeignKey(x => x.AppointmentId).OnDelete(DeleteBehavior.SetNull);
            e.Ignore(x => x.Subtotal);
            e.Ignore(x => x.TaxAmount);
            e.Ignore(x => x.Total);
        });

        b.Entity<InvoiceItem>(e =>
        {
            e.Property(x => x.Description).HasMaxLength(300).IsRequired();
            e.Property(x => x.UnitPrice).HasPrecision(10, 2);
            e.HasOne(x => x.Invoice).WithMany(i => i.Items)
                .HasForeignKey(x => x.InvoiceId).OnDelete(DeleteBehavior.Cascade);
            e.Ignore(x => x.Amount);
        });

        b.Entity<QueueEntry>(e =>
        {
            e.Property(x => x.Status).HasConversion<int>();
            e.Property(x => x.Notes).HasMaxLength(500);
            e.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Appointment).WithMany().HasForeignKey(x => x.AppointmentId).OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(x => new { x.DoctorId, x.Date, x.TokenNumber }).IsUnique();
        });

        b.Entity<Holiday>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.HasIndex(x => x.Date).IsUnique();
        });

        b.Entity<ClinicSetting>(e =>
        {
            e.Property(x => x.ClinicName).HasMaxLength(150).IsRequired();
            e.Property(x => x.Address).HasMaxLength(300);
            e.Property(x => x.Phone).HasMaxLength(30);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.DefaultTaxRate).HasPrecision(5, 2);
        });

        b.Entity<Payment>(e =>
        {
            e.Property(x => x.Method).HasConversion<int>();
            e.Property(x => x.Amount).HasPrecision(10, 2);
            e.Property(x => x.Reference).HasMaxLength(100);
            e.Property(x => x.CardHolder).HasMaxLength(120);
            e.Property(x => x.CardLast4).HasMaxLength(4);
            e.Property(x => x.BankName).HasMaxLength(120);
            e.Property(x => x.AccountName).HasMaxLength(120);
            e.Property(x => x.MobileNumber).HasMaxLength(20);
            e.HasOne(x => x.Invoice).WithMany(i => i.Payments)
                .HasForeignKey(x => x.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<PatientReport>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Type).HasConversion<int>();
            e.Property(x => x.Summary).HasMaxLength(2000);
            e.Property(x => x.Findings).HasMaxLength(4000);
            e.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Appointment).WithMany().HasForeignKey(x => x.AppointmentId).OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(x => new { x.PatientId, x.ReportDate });
        });
    }
}
