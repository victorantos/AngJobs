using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Stripe;

namespace StripeEntities
{
    /// <summary>
    /// Helpful extension methods for classes in Stripe.Net
    /// </summary>
    public static class StripeExtensions
    {
        /// <summary>
        /// Gets the default card associated with this customer
        /// </summary>
        /// <param name="customer"></param>
        /// <returns></returns>
        public static StripeCard GetDefaultCard(this StripeCustomer customer)
        {
            if (customer.StripeDefaultCard != null)
                return customer.StripeDefaultCard;

            if (string.IsNullOrEmpty(customer.StripeDefaultCardId))
                return null;

            if (customer.StripeCardList == null)
                return null;

            foreach(StripeCard card in customer.StripeCardList.StripeCards)
            {
                if (card.Id == customer.StripeDefaultCardId)
                    return card;
            }

            return null;
        }
    }
}
