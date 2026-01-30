namespace Api.Features.Users.Dtos;

using Api.Features.Users.Dtos;


public record UserDto(
    string Id,
    string UserName,
    string? AvatarUrl
);