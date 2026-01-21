using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Api.Domain;
using Api.Domain.Friends;

namespace Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<Attempt> Attempts => Set<Attempt>();
    public DbSet<ReactionAttemptDetails> ReactionAttemptDetails => Set<ReactionAttemptDetails>();
    public DbSet<ChimpAttemptDetails> ChimpAttemptDetails => Set<ChimpAttemptDetails>();
    public DbSet<TypingAttemptDetails> TypingAttemptDetails => Set<TypingAttemptDetails>();
    public DbSet<SequenceAttemptDetails> SequenceAttemptDetails => Set<SequenceAttemptDetails>();

    public DbSet<FriendRequest> FriendRequests => Set<FriendRequest>();
    public DbSet<Friendship> Friendships => Set<Friendship>();

    public DbSet<Like> Likes => Set<Like>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<Attempt>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.UserId).HasMaxLength(450).IsRequired();
            e.Property(x => x.Game).HasConversion<int>().IsRequired();
            e.Property(x => x.Value).IsRequired();
            e.Property(x => x.CreatedAt).IsRequired();

            e.HasIndex(x => new { x.UserId, x.Game, x.CreatedAt });
            e.HasIndex(x => new { x.Game, x.Value });
        });

        b.Entity<ReactionAttemptDetails>(e =>
        {
            e.HasKey(x => x.AttemptId);

            e.HasOne(x => x.Attempt)
             .WithOne(a => a.ReactionDetails)
             .HasForeignKey<ReactionAttemptDetails>(x => x.AttemptId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<TypingAttemptDetails>(e =>
        {
            e.HasKey(x => x.AttemptId);

            e.Property(x => x.Accuracy).HasPrecision(5, 2);

            e.HasOne(x => x.Attempt)
             .WithOne(a => a.TypingDetails)
             .HasForeignKey<TypingAttemptDetails>(x => x.AttemptId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ChimpAttemptDetails>(e =>
        {
            e.HasKey(x => x.AttemptId);
            e.HasOne(x => x.Attempt)
            .WithOne(a => a.ChimpDetails)
            .HasForeignKey<ChimpAttemptDetails>(x => x.AttemptId)
            .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<SequenceAttemptDetails>(e =>
        {
            e.HasKey(x => x.AttemptId);
            e.HasOne(x => x.Attempt)
             .WithOne(a => a.SequenceDetails)
             .HasForeignKey<SequenceAttemptDetails>(x => x.AttemptId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<FriendRequest>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.FromUserId).HasMaxLength(450).IsRequired();
            e.Property(x => x.ToUserId).HasMaxLength(450).IsRequired();
            e.Property(x => x.Status).HasConversion<int>().IsRequired();

            e.HasIndex(x => new { x.ToUserId, x.Status, x.CreatedAt });
            e.HasIndex(x => new { x.FromUserId, x.Status, x.CreatedAt });

            e.HasIndex(x => new { x.FromUserId, x.ToUserId, x.Status });
        });

        b.Entity<Friendship>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.UserAId).HasMaxLength(450).IsRequired();
            e.Property(x => x.UserBId).HasMaxLength(450).IsRequired();

            e.HasIndex(x => new { x.UserAId, x.UserBId }).IsUnique();

            e.HasIndex(x => x.UserAId);
            e.HasIndex(x => x.UserBId);
        });

        b.Entity<Like>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.AttemptId).IsRequired();
            e.Property(x => x.UserId).HasMaxLength(450).IsRequired();
            e.Property(x => x.CreatedAt).IsRequired();

            e.HasIndex(x => new { x.AttemptId, x.UserId }).IsUnique();

            e.HasIndex(x => x.AttemptId);

            e.HasIndex(x => x.UserId);

            e.HasOne(x => x.Attempt)
             .WithMany()
             .HasForeignKey(x => x.AttemptId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
