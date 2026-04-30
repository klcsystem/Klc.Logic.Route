using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class ErpConnection : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public ErpType ErpType { get; set; }
    public string? EndpointUrl { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastSyncAt { get; set; }
    public string? LastSyncStatus { get; set; }
    public string? Settings { get; set; }
}
