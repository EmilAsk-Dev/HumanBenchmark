namespace Api.Features.Feed.Dtos;

public record FeedRequest(
    int Take = 50,
    int Skip = 0
);