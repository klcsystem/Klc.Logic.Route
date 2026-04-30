namespace Klc.LogicRoute.Domain.Entities;

public class UserOperationClaim
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RoleId { get; set; }
    public string Permission { get; set; } = string.Empty;
}
