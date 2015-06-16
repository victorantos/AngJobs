using System;

namespace StripeEntities
{
    /// <summary>
    /// An interface to be implemented by an object able to present data for Stripe users
    /// </summary>
    public interface IStripeUser
    {
        /// <summary>
        /// Gets or sets the payment information associated with this user
        /// </summary>
        string PaymentSystemId { get; set; }

        /// <summary>
        /// Gets or sets the e-mail address for this user, which is used to uniquely identify them in the payment system
        /// </summary>
        string Email { get; set; }
    }

    /// <summary>
    /// Extension methods on the IPaymentUser interface
    /// </summary>
    public static class IStripeUserExtensions
    {
        /// <summary>
        /// Returns true if the given user has payment information attached
        /// Otherwise, returns false
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        public static bool HasPaymentInfo(this IStripeUser user)
        {
            return !string.IsNullOrEmpty(user.PaymentSystemId);
        }
    }
}
