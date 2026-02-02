// using Api.Data;
// using Api.Domain;
// using Api.Features.Comments;
// using Microsoft.EntityFrameworkCore;
// using Xunit;

// namespace Api.Tests.Features.Comments;

// public class CommentServiceTests
// {
//     private ApplicationDbContext CreateInMemoryDbContext()
//     {
//         var options = new DbContextOptionsBuilder<ApplicationDbContext>()
//             .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
//             .Options;

//         return new ApplicationDbContext(options);
//     }

//     private async Task<(ApplicationDbContext db, Post post)> SetupPostAsync()
//     {
//         var db = CreateInMemoryDbContext();
//         var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
//         db.Users.Add(user);

//         var attempt = new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow };
//         db.Attempts.Add(attempt);
//         await db.SaveChangesAsync();

//         var post = new Post { AttemptId = attempt.Id, UserId = "user-1", CreatedAt = DateTime.UtcNow };
//         db.Posts.Add(post);
//         await db.SaveChangesAsync();

//         return (db, post);
//     }

//     [Fact]
//     public async Task AddAsync_CreatesComment_WhenValid()
//     {
//         // Arrange
//         var (db, post) = await SetupPostAsync();
//         var service = new CommentService(db);
//         var request = new CreateCommentRequest("Great score!", null);

//         // Act
//         var result = await service.AddAsync(post.Id, "user-1", request);

//         // Assert
//         Assert.NotNull(result);
//         Assert.Equal("Great score!", result.Content);
//         Assert.Equal(post.Id, result.PostId);
//         Assert.Equal("user-1", result.UserId);

//         db.Dispose();
//     }

//     [Fact]
//     public async Task AddAsync_ThrowsException_WhenContentIsEmpty()
//     {
//         // Arrange
//         var (db, post) = await SetupPostAsync();
//         var service = new CommentService(db);
//         var request = new CreateCommentRequest("", null);

//         // Act & Assert
//         await Assert.ThrowsAsync<ArgumentException>(() => service.AddAsync(post.Id, "user-1", request));

//         db.Dispose();
//     }

//     [Fact]
//     public async Task AddAsync_ThrowsException_WhenContentTooLong()
//     {
//         // Arrange
//         var (db, post) = await SetupPostAsync();
//         var service = new CommentService(db);
//         var request = new CreateCommentRequest(new string('x', 2001), null);

//         // Act & Assert
//         await Assert.ThrowsAsync<ArgumentException>(() => service.AddAsync(post.Id, "user-1", request));

//         db.Dispose();
//     }

//     [Fact]
//     public async Task GetForPostAsync_ReturnsComments_OrderedByCreatedAtDescending()
//     {
//         // Arrange
//         var (db, post) = await SetupPostAsync();

//         var comment1 = new Comment { PostId = post.Id, UserId = "user-1", Content = "First", CreatedAt = DateTime.UtcNow.AddMinutes(-10) };
//         var comment2 = new Comment { PostId = post.Id, UserId = "user-1", Content = "Second", CreatedAt = DateTime.UtcNow };
//         db.Comments.AddRange(comment1, comment2);
//         await db.SaveChangesAsync();

//         var service = new CommentService(db);

//         // Act
//         var result = await service.GetForPostAsync(post.Id, "user-1", 0, 50);

//         // Assert
//         Assert.Equal(2, result.Count);
//         Assert.Equal("Second", result[0].Content);
//         Assert.Equal("First", result[1].Content);

//         db.Dispose();
//     }

//     [Fact]
//     public async Task GetForPostAsync_RespectsSkipAndTake()
//     {
//         // Arrange
//         var (db, post) = await SetupPostAsync();

//         for (int i = 0; i < 10; i++)
//         {
//             db.Comments.Add(new Comment { PostId = post.Id, UserId = "user-1", Content = $"Comment {i}", CreatedAt = DateTime.UtcNow.AddMinutes(-i) });
//         }
//         await db.SaveChangesAsync();

//         var service = new CommentService(db);

//         // Act
//         var result = await service.GetForPostAsync(post.Id, "user-1", 2, 3);

//         // Assert
//         Assert.Equal(3, result.Count);

//         db.Dispose();
//     }

//     [Fact]
//     public async Task DeleteAsync_DeletesComment_WhenOwner()
//     {
//         // Arrange
//         var (db, post) = await SetupPostAsync();

//         var comment = new Comment { PostId = post.Id, UserId = "user-1", Content = "To delete", CreatedAt = DateTime.UtcNow };
//         db.Comments.Add(comment);
//         await db.SaveChangesAsync();

//         var service = new CommentService(db);

//         // Act
//         var result = await service.DeleteAsync(comment.Id, "user-1");

//         // Assert
//         Assert.True(result);
//         Assert.Empty(db.Comments);

//         db.Dispose();
//     }

//     [Fact]
//     public async Task DeleteAsync_ThrowsException_WhenNotOwner()
//     {
//         // Arrange
//         var (db, post) = await SetupPostAsync();

//         var comment = new Comment { PostId = post.Id, UserId = "user-1", Content = "Not yours", CreatedAt = DateTime.UtcNow };
//         db.Comments.Add(comment);
//         await db.SaveChangesAsync();

//         var service = new CommentService(db);

//         // Act & Assert
//         await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.DeleteAsync(comment.Id, "user-2"));

//         db.Dispose();
//     }

//     [Fact]
//     public async Task DeleteAsync_ReturnsFalse_WhenCommentNotFound()
//     {
//         // Arrange
//         var (db, _) = await SetupPostAsync();
//         var service = new CommentService(db);

//         // Act
//         var result = await service.DeleteAsync(999, "user-1");

//         // Assert
//         Assert.False(result);

//         db.Dispose();
//     }

//     [Fact]
//     public async Task AddAsync_CreatesReply_WhenParentCommentExists()
//     {
//         // Arrange
//         var (db, post) = await SetupPostAsync();

//         var parentComment = new Comment { PostId = post.Id, UserId = "user-1", Content = "Parent", CreatedAt = DateTime.UtcNow };
//         db.Comments.Add(parentComment);
//         await db.SaveChangesAsync();

//         var service = new CommentService(db);
//         var request = new CreateCommentRequest("Reply", parentComment.Id);

//         // Act
//         var result = await service.AddAsync(post.Id, "user-1", request);

//         // Assert
//         Assert.NotNull(result);
//         Assert.Equal(parentComment.Id, result.ParentCommentId);

//         db.Dispose();
//     }
// }
