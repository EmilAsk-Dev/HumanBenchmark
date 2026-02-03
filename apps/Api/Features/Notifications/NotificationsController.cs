using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Api.Features.Notifications.Dtos;

namespace Api.Features.Notifications;

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly NotificationService _service;

    public NotificationsController(NotificationService service)
    {
        _service = service;
    }

    private string Me =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new Exception("User not authenticated");

    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> Get(
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int take = 50)
    {
        var items = await _service.GetAsync(Me, unreadOnly, take);
        return Ok(items);
    }


    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] SendNotificationRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.UserId)) return BadRequest("UserId required");
        if (string.IsNullOrWhiteSpace(req.Type)) return BadRequest("Type required");
        if (string.IsNullOrWhiteSpace(req.Title)) return BadRequest("Title required");
        if (string.IsNullOrWhiteSpace(req.Message)) return BadRequest("Message required");

        var id = await _service.SendAsync(req.UserId, req.Type, req.Title, req.Message, req.Data);
        return Ok(new { id });
    }

    [HttpPost("{id:long}/read")]
    public async Task<IActionResult> MarkRead([FromRoute] long id)
    {
        var ok = await _service.MarkReadAsync(Me, id);
        return ok ? Ok(new { ok = true }) : NotFound();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var count = await _service.MarkAllReadAsync(Me);
        return Ok(new { updated = count });
    }

    public class SendNotificationRequest
    {
        public string UserId { get; set; } = "";
        public string Type { get; set; } = "";
        public string Title { get; set; } = "";
        public string Message { get; set; } = "";
        public object? Data { get; set; }
    }
}
