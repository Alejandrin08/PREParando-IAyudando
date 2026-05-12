using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PrepApi.Models;

namespace PrepApi.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Acta> Actas { get; set; }
        public DbSet<ActaField> ActaFields { get; set; }
        public DbSet<ActaValidation> ActaValidations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Acta>(entity =>
            {
                entity.HasKey(a => a.Id);
                entity.Property(a => a.ConfidenceLevel).HasConversion<string>();
                entity.Property(a => a.Status).HasDefaultValue("Pending");
                entity.HasIndex(a => a.Status);
                entity.HasIndex(a => a.AssignedQueue);
                entity.HasIndex(a => a.IngestedAt);
            });

            modelBuilder.Entity<ActaField>(entity =>
            {
                entity.HasKey(f => f.Id);
                entity.Property(f => f.ConfidenceLevel).HasConversion<string>();
                entity.HasIndex(f => f.ActaId);
                entity.HasIndex(f => f.FieldName);
                entity.HasOne(f => f.Acta)
                      .WithMany(a => a.Fields)
                      .HasForeignKey(f => f.ActaId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ActaValidation>(entity =>
            {
                entity.HasKey(v => v.Id);
                entity.HasIndex(v => v.ActaId);
                entity.HasOne(v => v.Acta)
                      .WithMany(a => a.Validations)
                      .HasForeignKey(v => v.ActaId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}