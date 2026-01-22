using Api.Domain;

namespace Api.Features.Users.Dtos;

public record TestSeriesDto(
    GameType TestType,
    List<DataPointDto> DataPoints
);

public record DataPointDto(
    DateTime Date,
    int Score
);
