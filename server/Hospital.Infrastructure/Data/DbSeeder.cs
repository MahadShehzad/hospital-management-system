using Hospital.Domain.Entities;
using Hospital.Domain.Enums;
using Hospital.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace Hospital.Infrastructure.Data;

/// <summary>
/// Idempotent development seed. Default password for every seeded account is
/// <c>Passw0rd!</c>.
/// </summary>
public static class DbSeeder
{
    public const string DefaultPassword = "Passw0rd!";

    public static async Task SeedAsync(AppDbContext db, IPasswordHasher hasher, CancellationToken ct = default)
    {
        await db.Database.MigrateAsync(ct);

        if (!await db.ClinicSettings.AnyAsync(ct))
        {
            db.ClinicSettings.Add(new ClinicSetting
            {
                ClinicName = "MediCare Clinic",
                Address = "12-C, Main Boulevard, Gulberg III, Lahore",
                Phone = "042-111-222-333",
                Email = "info@medicare.test",
            });
            await db.SaveChangesAsync(ct);
        }

        if (!await db.Holidays.AnyAsync(ct))
        {
            db.Holidays.AddRange(
                new Holiday { Date = new DateOnly(DateTime.Now.Year, 3, 23), Name = "Pakistan Day" },
                new Holiday { Date = new DateOnly(DateTime.Now.Year, 8, 14), Name = "Independence Day" },
                new Holiday { Date = new DateOnly(DateTime.Now.Year, 12, 25), Name = "Quaid-e-Azam Day" });
            await db.SaveChangesAsync(ct);
        }

        // Backfill fee schedule for doctors created before the fee columns existed.
        var doctorsMissingFees = await db.Doctors.Where(d => d.FollowUpFee == 0 && d.SurgeryFee == 0).ToListAsync(ct);
        if (doctorsMissingFees.Count > 0)
        {
            foreach (var d in doctorsMissingFees)
            {
                d.FollowUpFee = Math.Round(d.ConsultationFee * 0.6m / 100m) * 100m;
                d.ProcedureFee = d.ConsultationFee * 3m;
                d.SurgeryFee = d.ConsultationFee * 12m;
            }
            await db.SaveChangesAsync(ct);
        }

        if (await db.Users.AnyAsync(ct))
            return;

        var hash = hasher.Hash(DefaultPassword);

        var departments = new[]
        {
            new Department { Name = "Cardiology", Description = "Heart and vascular care" },
            new Department { Name = "Dermatology", Description = "Skin, hair and nail conditions" },
            new Department { Name = "Pediatrics", Description = "Child and adolescent health" },
            new Department { Name = "Orthopedics", Description = "Bones, joints and muscles" },
            new Department { Name = "Neurology", Description = "Brain and nervous system" },
            new Department { Name = "General Medicine", Description = "Primary and preventive care" },
        };
        db.Departments.AddRange(departments);
        await db.SaveChangesAsync(ct);

        // Admin + receptionist
        db.Users.Add(new User { FullName = "System Admin", Email = "admin@hospital.test", PasswordHash = hash, Role = UserRole.Admin, Phone = "0300-0000001" });
        db.Users.Add(new User { FullName = "Front Desk", Email = "reception@hospital.test", PasswordHash = hash, Role = UserRole.Receptionist, Phone = "0300-0000002" });

        // Patients
        var patientUsers = new[]
        {
            new User { FullName = "Ayesha Khan", Email = "ayesha@patient.test", PasswordHash = hash, Role = UserRole.Patient, Phone = "0301-1111111" },
            new User { FullName = "Bilal Ahmed", Email = "bilal@patient.test", PasswordHash = hash, Role = UserRole.Patient, Phone = "0302-2222222" },
        };
        db.Users.AddRange(patientUsers);
        await db.SaveChangesAsync(ct);

        db.Patients.AddRange(
            new Patient { UserId = patientUsers[0].Id, Dob = new DateOnly(1994, 4, 12), Gender = Gender.Female, BloodGroup = "B+", Address = "Gulberg, Lahore" },
            new Patient { UserId = patientUsers[1].Id, Dob = new DateOnly(1988, 9, 3), Gender = Gender.Male, BloodGroup = "O+", Address = "DHA, Karachi" });

        // Doctors
        var doctorSpecs = new (string Name, string Email, string Dept, string Spec, int Exp, decimal Fee)[]
        {
            ("Dr. Sara Malik", "sara@doctor.test", "Cardiology", "Interventional Cardiologist", 12, 3500m),
            ("Dr. Imran Sheikh", "imran@doctor.test", "Dermatology", "Cosmetic Dermatologist", 8, 2500m),
            ("Dr. Nadia Aslam", "nadia@doctor.test", "Pediatrics", "Neonatologist", 10, 2000m),
            ("Dr. Faisal Raza", "faisal@doctor.test", "Orthopedics", "Joint Replacement Surgeon", 15, 4000m),
            ("Dr. Hina Tariq", "hina@doctor.test", "Neurology", "Epileptologist", 9, 3800m),
            ("Dr. Usman Javed", "usman@doctor.test", "General Medicine", "Family Physician", 6, 1500m),
        };

        var deptByName = departments.ToDictionary(d => d.Name);
        var rnd = new Random(42);

        foreach (var d in doctorSpecs)
        {
            var user = new User { FullName = d.Name, Email = d.Email, PasswordHash = hash, Role = UserRole.Doctor, Phone = "0311-" + rnd.Next(1000000, 9999999) };
            db.Users.Add(user);
            await db.SaveChangesAsync(ct);

            var doctor = new Doctor
            {
                UserId = user.Id,
                DepartmentId = deptByName[d.Dept].Id,
                Specialization = d.Spec,
                Qualifications = "MBBS, FCPS",
                ExperienceYears = d.Exp,
                ConsultationFee = d.Fee,
                FollowUpFee = Math.Round(d.Fee * 0.6m / 100m) * 100m,
                ProcedureFee = d.Fee * 3m,
                SurgeryFee = d.Fee * 12m,
                Bio = $"{d.Name} is a {d.Spec.ToLowerInvariant()} with {d.Exp} years of clinical experience.",
                RatingAvg = Math.Round(3.6 + rnd.NextDouble() * 1.4, 1),
                RatingCount = rnd.Next(15, 220),
            };
            db.Doctors.Add(doctor);
            await db.SaveChangesAsync(ct);

            // Mon-Fri mornings, plus Tue/Thu evenings.
            foreach (var day in new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday })
            {
                db.DoctorAvailabilities.Add(new DoctorAvailability
                {
                    DoctorId = doctor.Id,
                    DayOfWeek = day,
                    StartTime = new TimeOnly(9, 0),
                    EndTime = new TimeOnly(13, 0),
                    SlotDurationMinutes = 30,
                });
            }
            foreach (var day in new[] { DayOfWeek.Tuesday, DayOfWeek.Thursday })
            {
                db.DoctorAvailabilities.Add(new DoctorAvailability
                {
                    DoctorId = doctor.Id,
                    DayOfWeek = day,
                    StartTime = new TimeOnly(17, 0),
                    EndTime = new TimeOnly(20, 0),
                    SlotDurationMinutes = 20,
                });
            }
        }

        await db.SaveChangesAsync(ct);
    }
}
