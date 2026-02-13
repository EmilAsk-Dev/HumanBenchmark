using Api.Data;
using Api.Domain;
using Api.Domain.Friends;
using Api.Features.Friends;
using Api.Features.WebSocket;
using Api.hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Api.Tests.Features.Friends;

public class FriendsServiceTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private FriendsService CreateService(ApplicationDbContext db)
    {
        // SendToUserAsync är inte virtual → mocka IHubContext istället
        var clientProxy = new Mock<IClientProxy>();
        clientProxy
            .Setup(c => c.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var hubClients = new Mock<IHubClients>();
        hubClients.Setup(c => c.User(It.IsAny<string>())).Returns(clientProxy.Object);

        var hubContext = new Mock<IHubContext<NotificationsHub>>();
        hubContext.Setup(h => h.Clients).Returns(hubClients.Object);

        var notifications = new NotificationSender(hubContext.Object);
        return new FriendsService(db, notifications);
    }

    // ── GetFriendsAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetFriendsAsync_ReturnsEmpty_WhenNoFriends()
    {
        using var db = CreateInMemoryDbContext();
        db.Users.Add(new ApplicationUser { Id = "u1", UserName = "alice", Email = "a@test.com" });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.GetFriendsAsync("u1");

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetFriendsAsync_ReturnsFriend_WhenFriendshipExists()
    {
        using var db = CreateInMemoryDbContext();
        db.Users.Add(new ApplicationUser { Id = "u1", UserName = "alice", Email = "a@test.com" });
        db.Users.Add(new ApplicationUser { Id = "u2", UserName = "bob", Email = "b@test.com" });
        db.Friendships.Add(new Friendship { UserAId = "u1", UserBId = "u2", CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.GetFriendsAsync("u1");

        Assert.Single(result);
        Assert.Equal("u2", result[0].User.Id);
    }

    [Fact]
    public async Task GetFriendsAsync_ReturnsFriend_WhenUserIsBSide()
    {
        using var db = CreateInMemoryDbContext();
        db.Users.Add(new ApplicationUser { Id = "u1", UserName = "alice", Email = "a@test.com" });
        db.Users.Add(new ApplicationUser { Id = "u2", UserName = "bob", Email = "b@test.com" });
        // u1 är UserBId (B-sidan)
        db.Friendships.Add(new Friendship { UserAId = "u2", UserBId = "u1", CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.GetFriendsAsync("u1");

        Assert.Single(result);
        Assert.Equal("u2", result[0].User.Id);
    }

    // ── SendRequestAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task SendRequestAsync_CreatesRequest_WhenValid()
    {
        using var db = CreateInMemoryDbContext();
        db.Users.Add(new ApplicationUser { Id = "u1", UserName = "alice", Email = "a@test.com" });
        db.Users.Add(new ApplicationUser { Id = "u2", UserName = "bob", Email = "b@test.com" });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        await service.SendRequestAsync("u1", "u2");

        var req = await db.FriendRequests.FirstOrDefaultAsync();
        Assert.NotNull(req);
        Assert.Equal("u1", req.FromUserId);
        Assert.Equal("u2", req.ToUserId);
        Assert.Equal(FriendRequestStatus.Pending, req.Status);
    }

    [Fact]
    public async Task SendRequestAsync_ThrowsException_WhenSendingToSelf()
    {
        using var db = CreateInMemoryDbContext();
        var service = CreateService(db);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            service.SendRequestAsync("u1", "u1"));

        Assert.Contains("yourself", ex.Message);
    }

    [Fact]
    public async Task SendRequestAsync_ThrowsException_WhenAlreadyFriends()
    {
        using var db = CreateInMemoryDbContext();
        db.Friendships.Add(new Friendship { UserAId = "u1", UserBId = "u2", CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            service.SendRequestAsync("u1", "u2"));

        Assert.Contains("Already friends", ex.Message);
    }

    [Fact]
    public async Task SendRequestAsync_ThrowsException_WhenRequestAlreadyPending()
    {
        using var db = CreateInMemoryDbContext();
        db.FriendRequests.Add(new FriendRequest
        {
            FromUserId = "u1",
            ToUserId = "u2",
            Status = FriendRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            service.SendRequestAsync("u1", "u2"));

        Assert.Contains("already exists", ex.Message);
    }

    [Fact]
    public async Task SendRequestAsync_ThrowsException_WhenReverseRequestAlreadyPending()
    {
        // bob skickade redan en förfrågan till alice → alice kan inte skicka till bob
        using var db = CreateInMemoryDbContext();
        db.FriendRequests.Add(new FriendRequest
        {
            FromUserId = "u2",
            ToUserId = "u1",
            Status = FriendRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            service.SendRequestAsync("u1", "u2"));

        Assert.Contains("already exists", ex.Message);
    }

    // ── RespondToRequestAsync ────────────────────────────────────────────────

    [Fact]
    public async Task RespondToRequestAsync_AcceptRequest_CreatesFriendship()
    {
        using var db = CreateInMemoryDbContext();
        db.FriendRequests.Add(new FriendRequest
        {
            Id = 1,
            FromUserId = "u1",
            ToUserId = "u2",
            Status = FriendRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        await service.RespondToRequestAsync("u2", 1, accept: true);

        var friendship = await db.Friendships.FirstOrDefaultAsync();
        Assert.NotNull(friendship);

        var req = await db.FriendRequests.FirstAsync();
        Assert.Equal(FriendRequestStatus.Accepted, req.Status);
    }

    [Fact]
    public async Task RespondToRequestAsync_AcceptRequest_CreatesConversation()
    {
        using var db = CreateInMemoryDbContext();
        db.FriendRequests.Add(new FriendRequest
        {
            Id = 1,
            FromUserId = "u1",
            ToUserId = "u2",
            Status = FriendRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        await service.RespondToRequestAsync("u2", 1, accept: true);

        var conversation = await db.Conversations.FirstOrDefaultAsync();
        Assert.NotNull(conversation);
    }

    [Fact]
    public async Task RespondToRequestAsync_DeclineRequest_DoesNotCreateFriendship()
    {
        using var db = CreateInMemoryDbContext();
        db.FriendRequests.Add(new FriendRequest
        {
            Id = 1,
            FromUserId = "u1",
            ToUserId = "u2",
            Status = FriendRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        await service.RespondToRequestAsync("u2", 1, accept: false);

        var friendship = await db.Friendships.FirstOrDefaultAsync();
        Assert.Null(friendship);

        var req = await db.FriendRequests.FirstAsync();
        Assert.Equal(FriendRequestStatus.Declined, req.Status);
    }

    [Fact]
    public async Task RespondToRequestAsync_ThrowsException_WhenRequestNotFound()
    {
        using var db = CreateInMemoryDbContext();
        var service = CreateService(db);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            service.RespondToRequestAsync("u2", 999, accept: true));

        Assert.Contains("not found", ex.Message);
    }

    [Fact]
    public async Task RespondToRequestAsync_ThrowsException_WhenNotRecipient()
    {
        using var db = CreateInMemoryDbContext();
        db.FriendRequests.Add(new FriendRequest
        {
            Id = 1,
            FromUserId = "u1",
            ToUserId = "u2",
            Status = FriendRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        // u3 försöker svara på u2:s förfrågan
        var ex = await Assert.ThrowsAsync<Exception>(() =>
            service.RespondToRequestAsync("u3", 1, accept: true));

        Assert.Contains("Not allowed", ex.Message);
    }

    // ── RemoveFriendAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task RemoveFriendAsync_RemovesFriendship_WhenExists()
    {
        using var db = CreateInMemoryDbContext();
        db.Friendships.Add(new Friendship { UserAId = "u1", UserBId = "u2", CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        await service.RemoveFriendAsync("u1", "u2");

        var remaining = await db.Friendships.CountAsync();
        Assert.Equal(0, remaining);
    }

    [Fact]
    public async Task RemoveFriendAsync_ThrowsException_WhenFriendshipNotFound()
    {
        using var db = CreateInMemoryDbContext();
        var service = CreateService(db);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            service.RemoveFriendAsync("u1", "u2"));

        Assert.Contains("not found", ex.Message);
    }
}
