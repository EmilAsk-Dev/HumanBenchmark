using Api.Data;
using Api.Domain;
public class Comment
{
    public long Id { get; set; }

    public long PostId { get; set; }
    public Post Post { get; set; } = default!;

    public string UserId { get; set; } = default!;
    public ApplicationUser User { get; set; } = default!;

    public string Content { get; set; } = default!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Like> Likes { get; set; } = new List<Like>();
}