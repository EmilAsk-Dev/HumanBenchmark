using Api.Domain;

namespace Api.Features.Posts.Dtos;

public record PostDto(
  long Id,
  DateTime CreatedAt,
  string UserId,
  string UserName,
  string? AvatarUrl,
  GameType Game,
  int Value,
  string DisplayScore,
  double? Percentile,
  string? Caption,
  int LikeCount,
  int CommentCount,
  bool IsLikedByMe,
  AttemptDetailsDto? Details
);
