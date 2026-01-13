using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Ride.Api.Data.Entities;

namespace Ride.Api.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options), IApplicationDbContext
{
    public DbSet<Car> Cars => Set<Car>();
    public DbSet<CarImage> CarImages => Set<CarImage>();
    public DbSet<CarMake> CarMakes => Set<CarMake>();
    public DbSet<CarModel> CarModels => Set<CarModel>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Auction> Auctions => Set<Auction>();
    public DbSet<AuctionBid> AuctionBids => Set<AuctionBid>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(u => u.FirstName).HasMaxLength(100);
            entity.Property(u => u.LastName).HasMaxLength(100);
            entity.Property(u => u.SellerName).HasMaxLength(120);
            entity.Property(u => u.SellerSlug).HasMaxLength(120);
            entity.Property(u => u.InstagramName).HasMaxLength(30);
            entity.Property(u => u.FacebookName).HasMaxLength(100);
            entity.Property(u => u.SubscriptionTier).HasMaxLength(20);
            entity.Property(u => u.SubscriptionPriceEur).HasColumnType("decimal(18,2)");
            entity.Property(u => u.City).HasMaxLength(80);
            entity.Property(u => u.Address).HasMaxLength(200);
            entity.Property(u => u.ProfileType)
                .HasConversion<string>()
                .HasMaxLength(20);
        });

        modelBuilder.Entity<Car>(entity =>
        {
            entity.Property(c => c.Id).ValueGeneratedNever();
            entity.HasIndex(c => c.OwnerId);
            entity.OwnsOne(c => c.Location);

            var optionsConverter = new ValueConverter<List<OptionGroup>, string>(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<OptionGroup>>(v, (JsonSerializerOptions?)null) ?? new List<OptionGroup>());
            var optionsComparer = new ValueComparer<List<OptionGroup>>(
                (a, b) => JsonSerializer.Serialize(a, (JsonSerializerOptions?)null) == JsonSerializer.Serialize(b, (JsonSerializerOptions?)null),
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null).GetHashCode(),
                v => JsonSerializer.Deserialize<List<OptionGroup>>(JsonSerializer.Serialize(v, (JsonSerializerOptions?)null), (JsonSerializerOptions?)null) ?? new List<OptionGroup>());

            var optionProperty = entity.Property(c => c.OptionGroups)
                .HasConversion(optionsConverter)
                .HasColumnType("nvarchar(max)");
            optionProperty.Metadata.SetValueComparer(optionsComparer);

            entity.Property(c => c.EngineVolumeL).HasColumnType("decimal(18,2)");
            entity.Property(c => c.RentPricePerHour).HasColumnType("decimal(18,2)");
            entity.Property(c => c.RentPricePerDay).HasColumnType("decimal(18,2)");
            entity.Property(c => c.SalePrice).HasColumnType("decimal(18,2)");
            entity.Property(c => c.Fees).HasColumnType("decimal(18,2)");
            entity.Property(c => c.Taxes).HasColumnType("decimal(18,2)");

            entity.HasMany(c => c.Images)
                .WithOne(i => i.Car)
                .HasForeignKey(i => i.CarId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.CarMake)
                .WithMany(m => m.Cars)
                .HasForeignKey(c => c.CarMakeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.CarModel)
                .WithMany(m => m.Cars)
                .HasForeignKey(c => c.CarModelId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CarMake>(entity =>
        {
            entity.HasMany(m => m.Models)
                .WithOne(model => model.CarMake)
                .HasForeignKey(model => model.CarMakeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CarModel>(entity =>
        {
            entity.HasOne(model => model.CarMake)
                .WithMany(make => make.Models)
                .HasForeignKey(model => model.CarMakeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CarImage>(entity =>
        {
            entity.Property(i => i.Id).ValueGeneratedNever();
        });

        modelBuilder.Entity<Car>()
            .HasOne(c => c.Owner)
            .WithMany()
            .HasForeignKey(c => c.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Reservation>(entity =>
        {
            entity.Property(r => r.Id).ValueGeneratedNever();
            entity.HasIndex(r => r.CarId);
            entity.HasIndex(r => r.RenterId);
            entity.HasIndex(r => new { r.StartDate, r.EndDate });

            entity.Property(r => r.TotalPrice).HasColumnType("decimal(18,2)");
            entity.Property(r => r.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.HasOne(r => r.Car)
                .WithMany()
                .HasForeignKey(r => r.CarId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.Renter)
                .WithMany()
                .HasForeignKey(r => r.RenterId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Auction>(entity =>
        {
            entity.Property(a => a.Id).ValueGeneratedNever();
            entity.Property(a => a.StartPriceEur).HasColumnType("decimal(18,2)");
            entity.Property(a => a.BuyNowPriceEur).HasColumnType("decimal(18,2)");

            // Store list properties as JSON
            var stringListConverter = new ValueConverter<List<string>, string>(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>());
            var stringListComparer = new ValueComparer<List<string>>(
                (a, b) => JsonSerializer.Serialize(a, (JsonSerializerOptions?)null) == JsonSerializer.Serialize(b, (JsonSerializerOptions?)null),
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null).GetHashCode(),
                v => JsonSerializer.Deserialize<List<string>>(JsonSerializer.Serialize(v, (JsonSerializerOptions?)null), (JsonSerializerOptions?)null) ?? new List<string>());

            entity.Property(a => a.Issues).HasConversion(stringListConverter);
            entity.Property(a => a.ImageUrls).HasConversion(stringListConverter);
            entity.Property(a => a.VideoUrls).HasConversion(stringListConverter);
            entity.Property(a => a.Issues).Metadata.SetValueComparer(stringListComparer);
            entity.Property(a => a.ImageUrls).Metadata.SetValueComparer(stringListComparer);
            entity.Property(a => a.VideoUrls).Metadata.SetValueComparer(stringListComparer);

            entity.HasIndex(a => a.StartsAt);
            entity.HasIndex(a => a.EndsAt);
            entity.HasIndex(a => a.OwnerId);

            entity.HasOne(a => a.Car)
                .WithMany()
                .HasForeignKey(a => a.CarId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Owner)
                .WithMany()
                .HasForeignKey(a => a.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AuctionBid>(entity =>
        {
            entity.Property(b => b.Id).ValueGeneratedNever();
            entity.Property(b => b.AmountEur).HasColumnType("decimal(18,2)");
            entity.HasIndex(b => b.AuctionId);
            entity.HasIndex(b => b.BidderId);

            entity.HasOne(b => b.Auction)
                .WithMany(a => a.Bids)
                .HasForeignKey(b => b.AuctionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.Bidder)
                .WithMany()
                .HasForeignKey(b => b.BidderId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
