// using Api.Data;
// using Api.Domain;
// using Api.Features.Users;
// using Microsoft.EntityFrameworkCore;
// using Xunit;

// namespace Api.Tests.Features.Users;

// public class ProfileServiceTests
// {
//     private ApplicationDbContext CreateInMemoryDbContext()
//     {
//         var options = new DbContextOptionsBuilder<ApplicationDbContext>()
//             .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
//             .Options;

//         return new ApplicationDbContext(options);
//     }

//     [Fact]
//     public async Task GetProfileAsync_ReturnsNull_WhenUserNotFound()
//     {
//         // Arrange
//         using var db = CreateInMemoryDbContext();
//         var service = new ProfileService(db);

//         // Act
//         var result = await service.GetProfileAsync("nonexistent-user");

//         // Assert
//         Assert.Null(result);
//     }

//     [Fact]
//     public async Task GetProfileAsync_ReturnsProfile_WhenUserExists()
//     {
//         // Arrange
//         using var db = CreateInMemoryDbContext();
//         var user = new ApplicationUser
//         {
//             Id = "test-user-id",
//             UserName = "testuser",
//             Email = "test@example.com"
//         };
//         db.Users.Add(user);
//         await db.SaveChangesAsync();

//         var service = new ProfileService(db);

//         // Act
//         var result = await service.GetProfileAsync("test-user-id");

//         // Assert
//         Assert.NotNull(result);
//         Assert.Equal("test-user-id", result.UserId);
//         Assert.Equal("testuser", result.UserName);
//         Assert.Equal(0, result.TotalSessions);
//     }

//     [Fact]
//     public async Task GetProfileAsync_ReturnsTotalSessions_WhenAttemptsExist()
//     {
//         // Arrange
//         using var db = CreateInMemoryDbContext();
//         var user = new ApplicationUser
//         {
//             Id = "test-user-id",
//             UserName = "testuser",
//             Email = "test@example.com"
//         };
//         db.Users.Add(user);

//         db.Attempts.AddRange(
//             new Attempt { UserId = "test-user-id", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow },
//             new Attempt { UserId = "test-user-id", Game = GameType.Typing, Value = 50, CreatedAt = DateTime.UtcNow },
//             new Attempt { UserId = "test-user-id", Game = GameType.Reaction, Value = 180, CreatedAt = DateTime.UtcNow }
//         );
//         await db.SaveChangesAsync();

//         var service = new ProfileService(db);

//         // Act
//         var result = await service.GetProfileAsync("test-user-id");

//         // Assert
//         Assert.NotNull(result);
//         Assert.Equal(3, result.TotalSessions);
//     }

//     [Fact]
//     public async Task GetProfileAsync_ReturnsPersonalBests_ForEachGameType()
//     {
//         // Arrange
//         using var db = CreateInMemoryDbContext();
//         var user = new ApplicationUser
//         {
//             Id = "test-user-id",
//             UserName = "testuser",
//             Email = "test@example.com"
//         };
//         db.Users.Add(user);

//         db.Attempts.AddRange(
//             new Attempt { UserId = "test-user-id", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow },
//             new Attempt { UserId = "test-user-id", Game = GameType.Reaction, Value = 150, CreatedAt = DateTime.UtcNow },
//             new Attempt { UserId = "test-user-id", Game = GameType.Typing, Value = 50, CreatedAt = DateTime.UtcNow },
//             new Attempt { UserId = "test-user-id", Game = GameType.Typing, Value = 75, CreatedAt = DateTime.UtcNow }
//         );
//         await db.SaveChangesAsync();

//         var service = new ProfileService(db);

//         // Act
//         var result = await service.GetProfileAsync("test-user-id");

//         // Assert
//         Assert.NotNull(result);
//         Assert.NotNull(result.PbByTest);
//         Assert.True(result.PbByTest.ContainsKey("Reaction"));
//         Assert.True(result.PbByTest.ContainsKey("Typing"));
//         Assert.Equal(150, result.PbByTest["Reaction"].Score); // Lower is better for reaction
//         Assert.Equal(75, result.PbByTest["Typing"].Score); // Higher is better for typing
//     }
// }
