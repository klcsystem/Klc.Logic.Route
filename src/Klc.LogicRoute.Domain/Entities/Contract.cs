using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class Contract : BaseEntity
{
    public Guid ProviderId { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string? Name { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public ContractStatus Status { get; set; } = ContractStatus.Draft;
    public string? Notes { get; set; }
    public string? Currency { get; set; } = "TRY";

    public List<ContractRate> Rates { get; set; } = [];
}
