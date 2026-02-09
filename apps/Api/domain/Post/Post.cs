namespace Api.Domain;

using System.ComponentModel.DataAnnotations;
using Api.Data;
public class Post
{
    public long Id { get; set; }

    public bool IsPublic { get; set; } = false;

    public long AttemptId { get; set; }
    public Attempt Attempt { get; set; } = default!;

    public string UserId { get; set; } = default!;
    public ApplicationUser User { get; set; } = default!;

    public string? Caption { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Like> Likes { get; set; } = new List<Like>();
}
