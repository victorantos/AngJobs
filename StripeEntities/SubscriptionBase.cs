using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

using Masticore;

namespace StripeEntities
{
    /// <summary>
    /// A base model for connecting subscriptions to plans
    /// This should be extended into an application-specific class
    /// There should be one instance for each payment relationship between the system and a customer (one for each company)
    /// </summary>
    public abstract class SubscriptionBase : BaseModel, IStripeSubscription
    {
        /// <summary>
        /// Gets or sets the date this subscription will expire and be no longer valid
        /// NOTE: This is constantly pushed forward by the recurring billing action of the system
        /// </summary>
        [Display(Name = "Active Until")]
        public DateTime? ActiveUntil { get; set; }

        /// <summary>
        /// Gets or sets the ad hoc comments on this subscription
        /// </summary>
        public string Notes { get; set; }

        /// <summary>
        /// Gets or sets the identifier used by the payment system
        /// </summary>
        public string PaymentSystemId { get; set; }

        // To-One on SubscriptionPlan
        [ForeignKey("Plan")]
        public int PlanId { get; set; }

        /// <summary>
        /// Gets or sets the plan for this subscription, which provides info to the billing system like price
        /// </summary>
        public virtual SubscriptionPlan Plan { get; set; }
    }
}