using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Api.Features.Messages.Dtos;
namespace Api.Features.Messages;

[ApiController]
[Authorize]
[Route("api/messages")]
public class MessagesController : ControllerBase
{
    private readonly MessageService _service;

    public MessagesController(MessageService service)
    {
        _service = service;
    }

    private string Me =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new Exception("User not authenticated");

    // ✅ GET /messages/conversations
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        var result = await _service.GetConversationsAsync(Me);
        return Ok(result);
    }

    // ✅ GET /messages/:friendId
    [HttpGet("{friendId}")]
    public async Task<IActionResult> GetMessages(string friendId)
    {
        try
        {
            var result = await _service.GetMessagesAsync(Me, friendId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    // ✅ POST /messages/:friendId
    [HttpPost("{friendId}")]
    public async Task<IActionResult> SendMessage(
        string friendId,
        [FromBody] SendMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest("Message content cannot be empty");

        try
        {
            var result = await _service.SendMessageAsync(Me, friendId, request.Content);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("conversation/{friendId}")]
    public async Task<IActionResult> GetConversationId(string friendId)
    {
        try
        {
            var id = await _service.GetConversationIdAsync(Me, friendId);
            return Ok(new { conversationId = id });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}
