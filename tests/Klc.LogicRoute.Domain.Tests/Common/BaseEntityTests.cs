using FluentAssertions;
using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Tests.Common;

public class BaseEntityTests
{
    private class TestEntity : BaseEntity { }

    [Fact]
    public void BaseEntity_Olusturuldiginda_IdUretilmeli()
    {
        // Act
        var entity1 = new TestEntity();
        var entity2 = new TestEntity();

        // Assert
        entity1.Id.Should().NotBeEmpty();
        entity2.Id.Should().NotBeEmpty();
        entity1.Id.Should().NotBe(entity2.Id);
    }

    [Fact]
    public void BaseEntity_Olusturuldiginda_CreatedAtAyarlanmali()
    {
        // Act
        var entity = new TestEntity();

        // Assert
        entity.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, precision: TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void BaseEntity_VarsayilanIsDeletedFalseOlmali()
    {
        // Act
        var entity = new TestEntity();

        // Assert
        entity.IsDeleted.Should().BeFalse();
    }

    [Fact]
    public void BaseEntity_TenantIdVarsayilanEmptyGuidOlmali()
    {
        // Act
        var entity = new TestEntity();

        // Assert
        entity.TenantId.Should().Be(Guid.Empty);
    }

    [Fact]
    public void BaseEntity_AuditAlanlariNullOlabilir()
    {
        // Act
        var entity = new TestEntity();

        // Assert
        entity.CreatedBy.Should().BeNull();
        entity.UpdatedBy.Should().BeNull();
        entity.UpdatedAt.Should().BeNull();
    }
}
