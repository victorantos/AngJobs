using System;
namespace StripeEntities
{
    /// <summary>
    /// Interface for an object providing data storage for subscriptions (links from customers to plans)
    /// </summary>
    public interface IStripeSubscription
    {
        string PaymentSystemId { get; set; }
    }
}
