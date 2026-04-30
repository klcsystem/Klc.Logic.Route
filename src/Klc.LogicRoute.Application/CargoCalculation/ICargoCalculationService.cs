using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Application.CargoCalculation;

public interface ICargoCalculationService
{
    CargoDetail Calculate(Order order);
}
