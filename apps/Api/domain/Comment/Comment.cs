using System.ComponentModel.DataAnnotations;
using Api.Data;
using Api.Domain;
public class Comment
{

    [Key]
    public long Id { get; set; }


    [Required]
    public long PostId { get; set; }
    public Post Post { get; set; } = default!;

    public string UserId { get; set; } = default!;
    public ApplicationUser User { get; set; } = default!;


    public string Content { get; set; } = default!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public long? ParentCommentId { get; set; }
    public Comment? ParentComment { get; set; }
    public ICollection<Comment> Replies { get; set; } = new List<Comment>();

    public ICollection<Like> Likes { get; set; } = new List<Like>();
}
