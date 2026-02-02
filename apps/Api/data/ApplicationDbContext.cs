using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Api.Domain;
using Api.Domain.Friends;
using Api.Domain.Message;

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
    public DbSet<Post> Posts => Set<Post>();

    public DbSet<Comment> Comments => Set<Comment>();

    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
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

        b.Entity<Post>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.UserId).HasMaxLength(450).IsRequired();
            e.Property(x => x.AttemptId).IsRequired();
            e.Property(x => x.Caption).HasMaxLength(500);
            e.Property(x => x.CreatedAt).IsRequired();

            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            e.HasMany(x => x.Comments)
                .WithOne(x => x.Post)
                .HasForeignKey(x => x.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(x => x.Likes)
                .WithOne(x => x.Post)
                .HasForeignKey(x => x.PostId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        b.Entity<Like>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.UserId).HasMaxLength(450).IsRequired();
            e.Property(x => x.CreatedAt).IsRequired();

            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            e.ToTable(t => t.HasCheckConstraint(
                "CK_Likes_ExactlyOneTarget",
                "([PostId] IS NOT NULL AND [CommentId] IS NULL) OR ([PostId] IS NULL AND [CommentId] IS NOT NULL)"
            ));

            e.HasIndex(x => new { x.UserId, x.PostId })
                .IsUnique()
                .HasFilter("[PostId] IS NOT NULL");

            e.HasIndex(x => new { x.UserId, x.CommentId })
                .IsUnique()
                .HasFilter("[CommentId] IS NOT NULL");
        });

        b.Entity<Comment>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.UserId).HasMaxLength(450).IsRequired();
            e.Property(x => x.Content).HasMaxLength(2000).IsRequired();
            e.Property(x => x.CreatedAt).IsRequired();

            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            e.HasOne(c => c.ParentComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ParentCommentId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(x => x.Likes)
                .WithOne(x => x.Comment)
                .HasForeignKey(x => x.CommentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Conversation>(e =>
        {
            e.HasIndex(x => new { x.UserAId, x.UserBId }).IsUnique();

            e.HasMany(x => x.Messages)
                .WithOne(x => x.Conversation)
                .HasForeignKey(x => x.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Message>(e =>
        {
            e.HasIndex(x => new { x.ConversationId, x.SentAt });
            e.Property(x => x.Content).HasMaxLength(2000);
        });
    }
}
