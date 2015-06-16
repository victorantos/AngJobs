using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;
using System.Linq;

using Masticore;

namespace StripeEntities
{
    /// <summary>
    /// A model for capturing available subscription plans in the system
    /// There should be one of these for each pricing/service tier in the system
    /// These are mirrored into the billing system by API integration
    /// </summary>
    public class SubscriptionPlan : BaseModel, StripeEntities.IStripeSubscriptionPlan
    {
        /// <summary>
        /// Enumeration for the possible states of a subscription
        /// </summary>
        public enum SubscriptionState
        {
            Pending,
            Available,
            Retired
        }

        [Required]
        public virtual string Title { get; set; }

        /// <summary>
        /// The identifier used over in Stripe for this plan
        /// </summary>
        public string PaymentSystemId { get; set; }

        public string Note { get; set; }

        public string Currency { get; set; }

        [DataType(DataType.MultilineText)]
        public string Description { get; set; }

        [DisplayName("Trial Days")]
        [DefaultValue(0)]
        public int TrialDays { get; set; }

        public float Price { get; set; }

        [DefaultValue(SubscriptionState.Available)]
        public SubscriptionState State { get; set; }
    }

    public static class SubscriptionPlanExtensions
    {
        public static IOrderedQueryable<SubscriptionPlan> AllAvailablePlans(this DbSet<SubscriptionPlan> plans)
        {
            return plans.Where(p => p.State == SubscriptionPlan.SubscriptionState.Available)
                                                    .OrderByDescending(p => p.Price);
        }
    }
}