namespace Klc.LogicRoute.Domain.Entities;

public class OperationClaim
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsSystemRole { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<UserOperationClaim> Permissions { get; set; } = [];
}
